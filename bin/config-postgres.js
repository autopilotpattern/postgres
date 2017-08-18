'use strict';
const Cp = require('child_process');
const Path = require('path');
const Consulite = require('consulite');
const consulHost = `${process.env.CONSUL}:8500`;
const debug = require('debug')('config-postgres');
const isPreStart = process.argv[2] === 'preStart';
const isOnChange = process.argv[2] === 'onChange';

debug('running node script. preStart=%s, onChange=%s, env=%j',
  isPreStart, isOnChange, process.env);

if (!isPreStart && !isOnChange) {
  throw new Error('run in an unexpected mode');
}

lookupService((err, service) => {
  if (err) {
    throw err;
  }

  debug('service = %j', service);

  createPgConfFile(service);

  if (isPreStart && !service.isMaster) {
    createBaseBackup(service);
    createRecoveryFile(service);
  }
});


function createPgConfFile (service) {
  const template = '/etc/postgresql.conf.ctmpl';
  const conf = '/etc/postgresql.conf';

  debug('creating config file (%s) from template (%s).', conf, template);

  const cmd = 'consul-template -once' +
              ` -consul-addr ${consulHost}` +
              ` -template "${template}:${conf}` +
              (isOnChange ? ':pkill -SIGHUP postgres' : '') + '"';
  const env = service.isMaster ?
    Object.assign({}, process.env, { POSTGRES_MASTER: '1' }) :
    process.env;

  Cp.execSync(cmd, { env });
}


function createRecoveryFile (service) {
  const template = '/etc/recovery.conf.ctmpl';
  const conf = Path.join(process.env.PGDATA, 'recovery.conf');

  debug('creating config file (%s) from template (%s).', conf, template);

  if (service.isMaster) {
    throw new Error('attempting to create recovery file for master');
  }

  const cmd = 'consul-template -once' +
              ` -consul-addr ${consulHost}` +
              ` -template "${template}:${conf}"`;
  const env = Object.assign({}, process.env, {
    POSTGRES_MASTER_IP: service.address
  });

  Cp.execSync(cmd, { env });
}


function createBaseBackup (service) {
  debug('creating base backup.');

  if (service.isMaster) {
    throw new Error('attempting to create backup for master');
  }

  const cmd = `pg_basebackup -h ${service.address} -D ${process.env.PGDATA}` +
              ` -U ${process.env.POSTGRES_USER} -vP -w --xlog-method=stream`;
  const env = Object.assign({}, process.env, {
    PGPASSWORD: process.env.POSTGRES_PASSWORD
  });

  Cp.execSync(cmd, { env });
}


function lookupService (callback) {
  const consul = new Consulite({ consul: consulHost });
  const ip = process.env.CONTAINERPILOT_POSTGRES_IP;

  debug('looking up service in consul (%s)', consulHost);
  consul.getService('postgres', (err, service) => {
    if (err) {
      // If the service wasn't found, then this is the master.
      if (/postgres couldn't be found/.test(err.message)) {
        return callback(null, {
          isMaster: true,
          address: ip,
          port: 5432,
          executed: false
        });
      } else {
        return callback(err);
      }
    } else {
      service.isMaster = service.address === ip;
      callback(null, service);
    }
  });
}
