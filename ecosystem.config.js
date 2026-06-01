module.exports = {
  apps: [{
    name: 'nakhlespa',
    script: 'node_modules/.bin/next',
    args: 'start',
    instances: 2,
    exec_mode: 'cluster',
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000,
    },
  }],
}
