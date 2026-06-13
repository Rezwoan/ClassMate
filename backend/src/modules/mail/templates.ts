const BRAND = '#5B5BD6';
const BG = '#FAF8F5';
const TEXT = '#1F2430';
const MUTED = '#6B7280';

function shell(title: string, inner: string): string {
  return `<!doctype html><html><body style="margin:0;background:${BG};padding:24px;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:${TEXT}">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
    <table role="presentation" width="100%" style="max-width:480px;background:#fff;border-radius:20px;overflow:hidden;box-shadow:0 4px 20px rgba(31,36,48,.06)">
      <tr><td style="background:${BRAND};padding:20px 28px;color:#fff;font-size:20px;font-weight:700">📚 ClassMate</td></tr>
      <tr><td style="padding:28px">
        <h1 style="margin:0 0 12px;font-size:20px;color:${TEXT}">${title}</h1>
        ${inner}
      </td></tr>
      <tr><td style="padding:18px 28px;border-top:1px solid #ECE9E3;color:${MUTED};font-size:12px">
        You're receiving this because you have a ClassMate account. If this wasn't you, you can ignore this email.
      </td></tr>
    </table>
  </td></tr></table></body></html>`;
}

export function otpTemplate(name: string, code: string, purposeLabel: string): string {
  return shell(
    `Your verification code`,
    `<p style="margin:0 0 16px;color:${MUTED};font-size:15px">Hi ${name}, use this code to ${purposeLabel}. It expires in 10 minutes.</p>
     <div style="text-align:center;margin:20px 0">
       <span style="display:inline-block;font-size:34px;letter-spacing:10px;font-weight:700;color:${BRAND};background:#ECEBFB;border-radius:14px;padding:16px 24px">${code}</span>
     </div>
     <p style="margin:16px 0 0;color:${MUTED};font-size:13px">Never share this code with anyone.</p>`,
  );
}

export function reminderTemplate(heading: string, body: string): string {
  return shell(
    heading,
    `<p style="margin:0;color:${TEXT};font-size:15px;line-height:1.6">${body}</p>`,
  );
}
