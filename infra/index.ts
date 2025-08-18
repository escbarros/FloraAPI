import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';
import * as fs from 'fs';

const config = new pulumi.Config();
const dockerUsername = config.require('dockerUsername');
const dockerPassword = config.requireSecret('dockerPassword');
const envFileContent = config.requireSecret('envFile');

// AMI Ubuntu
const ubuntuAmi = aws.ec2.getAmi({
  mostRecent: true,
  owners: ['099720109477'],
  filters: [
    {
      name: 'name',
      values: ['ubuntu/images/hvm-ssd/ubuntu-jammy-22.04-amd64-server-*'],
    },
    { name: 'virtualization-type', values: ['hvm'] },
  ],
});

// Security Group
const sg = new aws.ec2.SecurityGroup('flora-sg', {
  description: 'Allow SSH and API traffic',
  ingress: [
    { protocol: 'tcp', fromPort: 22, toPort: 22, cidrBlocks: ['0.0.0.0/0'] },
    {
      protocol: 'tcp',
      fromPort: 3000,
      toPort: 3000,
      cidrBlocks: ['0.0.0.0/0'],
    },
  ],
  egress: [
    { protocol: '-1', fromPort: 0, toPort: 0, cidrBlocks: ['0.0.0.0/0'] },
  ],
});

// KeyPair
const publicKey = fs.readFileSync('./flora-key.pub', 'utf-8');
const keyPair = new aws.ec2.KeyPair('flora-keypair', {
  publicKey,
});

// EC2 Instance
const server = new aws.ec2.Instance('flora-ec2', {
  instanceType: 't3.small',
  ami: ubuntuAmi.then((ami) => ami.id),
  keyName: keyPair.keyName,
  vpcSecurityGroupIds: [sg.id],
  userData: pulumi.all([dockerUsername, dockerPassword, envFileContent]).apply(
    ([user, pass, env]) => `#!/bin/bash
set -e

# Instala pacotes
apt-get update -y
apt-get install -y docker.io docker-compose git netcat-openbsd

systemctl start docker
systemctl enable docker

# Login no Docker Hub
echo "${pass}" | docker login --username "${user}" --password-stdin

# Clona repositório
cd /home/ubuntu
if [ ! -d "flora-api" ]; then
  git clone https://github.com/eduardoscb/flora-api.git
fi
cd flora-api

# Cria .env com secrets
cat <<'EOFENV' > .env
${env}
EOFENV

# Sobe containers
docker-compose pull
docker-compose up -d
`,
  ),
  tags: { Name: 'flora-ec2' },
});

export const publicIp = server.publicIp;
export const publicDns = server.publicDns;
