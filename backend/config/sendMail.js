import {createTransport} from 'nodemailer'

const sendMail = async({email, subject, html}) => {
  const transport = createTransport({
    host: "smtp.gmail.com",
    port: 465,
    auth: {
      user: "shfhsh",
      pass: "dhfshd",
    },
  });
  await transport.sendMail({
    from: "dhjsdfs",
    to: email,
    subject,
    html,
  });
};


export default sendMail