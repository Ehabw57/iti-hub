const nodemailer = require('nodemailer');
const sendEmail = require('../../utils/sendEmail');
const { getPasswordResetTemplate } = require('../../utils/emailTemplates');

describe('SMTP email composition', () => {
  const keys = ['NODE_ENV', 'EMAIL_SERVICE', 'EMAIL_USER', 'EMAIL_PASSWORD', 'EMAIL_FROM_ADDRESS'];
  let saved;
  beforeEach(() => {
    saved = Object.fromEntries(keys.map(key => [key, process.env[key]]));
    Object.assign(process.env, { NODE_ENV: 'development', EMAIL_SERVICE: 'gmail', EMAIL_USER: 'sender@example.com', EMAIL_PASSWORD: 'test-app-password', EMAIL_FROM_ADDRESS: 'sender@example.com' });
  });
  afterEach(() => keys.forEach(key => {
    if (saved[key] === undefined) delete process.env[key];
    else process.env[key] = saved[key];
  }));
  it('composes a reset email with the real inline logo and unchanged reset link', async () => {
    const streamTransport = nodemailer.createTransport({ streamTransport: true, buffer: true });
    let delivered;
    const originalSend = streamTransport.sendMail.bind(streamTransport);
    spyOn(streamTransport, 'sendMail').and.callFake(async options => { delivered = await originalSend(options); return delivered; });
    spyOn(nodemailer, 'createTransport').and.returnValue(streamTransport);
    const link = 'http://localhost:5173/password-reset/confirm?token=exampletoken';
    const html = getPasswordResetTemplate(link, 'Test User');
    const result = await sendEmail({ to: 'recipient@example.com', subject: 'Reset password', html });
    expect(html).toContain(link);
    expect(delivered.message.toString()).toContain('Content-ID: <iti-hub-logo>');
    expect(delivered.message.toString()).toContain('Content-Type: image/png');
    expect(result.id).toBe(delivered.messageId);
  });
  it('propagates SMTP failures to the calling controller', async () => {
    const error = new Error('SMTP authentication failed');
    spyOn(nodemailer, 'createTransport').and.returnValue({ sendMail: () => Promise.reject(error) });
    await expectAsync(sendEmail({ to: 'recipient@example.com', subject: 'Test', text: 'Test' })).toBeRejectedWith(error);
  });
  it('never sends network mail in test mode', async () => {
    process.env.NODE_ENV = 'test';
    const spy = spyOn(nodemailer, 'createTransport');
    expect(await sendEmail({ to: 'recipient@example.com', subject: 'Test' })).toEqual({ id: 'test-mode-no-send' });
    expect(spy).not.toHaveBeenCalled();
  });
});
