import 'dotenv/config';
import bcrypt from 'bcrypt';
import { createInterface } from 'node:readline/promises';
import { stdin, stdout } from 'node:process';
import { prisma } from '../src/config/prisma.js';

function promptHidden(question) {
  if (!stdin.isTTY || typeof stdin.setRawMode !== 'function') throw new Error('Run this command from an interactive terminal.');
  return new Promise((resolve, reject) => {
    stdout.write(question);
    stdin.setRawMode(true);
    stdin.resume();
    let value = '';
    const finish = (error) => {
      stdin.removeListener('data', onData);
      stdin.setRawMode(false);
      stdin.pause();
      stdout.write('\n');
      if (error) reject(error);
      else resolve(value);
    };
    const onData = (chunk) => {
      for (const character of chunk.toString('utf8')) {
        if (character === '\u0003') return finish(new Error('Admin bootstrap cancelled.'));
        if (character === '\r' || character === '\n') return finish();
        if (character === '\u007f' || character === '\b') value = value.slice(0, -1);
        else value += character;
      }
    };
    stdin.on('data', onData);
  });
}

async function main() {
  if (process.env.NODE_ENV !== 'production') throw new Error('This command is only for the first production administrator.');
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required.');
  const target = new URL(process.env.DATABASE_URL);
  stdout.write(`Production database target: ${target.hostname}${target.pathname}\n`);

  const activeAdminCount = await prisma.user.count({ where: { role: 'ADMIN', isActive: true } });
  if (activeAdminCount > 0) throw new Error('An active administrator already exists; bootstrap is disabled.');

  const rl = createInterface({ input: stdin, output: stdout });
  const confirmation = await rl.question('Type CREATE FIRST ADMIN to continue: ');
  if (confirmation !== 'CREATE FIRST ADMIN') {
    rl.close();
    throw new Error('Confirmation did not match; no account was created.');
  }
  const name = (await rl.question('Administrator name: ')).trim();
  const email = (await rl.question('Administrator email: ')).trim().toLowerCase();
  rl.close();

  if (name.length < 2 || name.length > 100) throw new Error('Name must be between 2 and 100 characters.');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) throw new Error('Enter a valid administrator email address.');

  const password = await promptHidden('Administrator password (input hidden): ');
  if (Buffer.byteLength(password, 'utf8') < 16 || Buffer.byteLength(password, 'utf8') > 72) throw new Error('Password must be between 16 and 72 UTF-8 bytes.');
  const passwordConfirmation = await promptHidden('Confirm password (input hidden): ');
  if (password !== passwordConfirmation) throw new Error('Passwords did not match; no account was created.');

  await prisma.$transaction(async (tx) => {
    const count = await tx.user.count({ where: { role: 'ADMIN', isActive: true } });
    if (count > 0) throw new Error('An active administrator was created concurrently; no account was created.');
    await tx.user.create({ data: { name, email, passwordHash: await bcrypt.hash(password, 12), role: 'ADMIN' } });
  }, { isolationLevel: 'Serializable' });
  stdout.write(`Created the first administrator account for ${email}.\n`);
}

main()
  .catch((error) => {
    console.error(error.message || 'Admin bootstrap failed.');
    process.exitCode = 1;
  })
  .finally(async () => prisma.$disconnect());
