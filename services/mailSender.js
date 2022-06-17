const nodemailer = require("nodemailer");
require("dotenv").config();
const jwt = require("jsonwebtoken");

module.exports = {
  sendEmail: async (to, replyTo, verificationUrl, iTeamId) => {
    let otp = Math.floor(Math.random() * (999999 - 100000 + 1) + 100000);
    console.log(`---------------------------------> ${otp}`);
    const object = {
      otp: otp,
      email: to,
      verificationUrl: verificationUrl,
      iTeamId: iTeamId,
    };
    let token = jwt.sign(object, process.env.JWT_SECRET);
    let link = `${verificationUrl}?token=${token}`;
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: "tony94091@gmail.com",
        pass: "ABCdef123@",
      },
    });

    const mailOptions = {
      from: "tony94091@gmail.com",
      to: `${to}`,
      subject: `${replyTo}`,
      replyTo: `${to}`,
      html: `<!DOCTYPE html>
                <html lang="en">
                
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <link href="https://fonts.googleapis.com/css2?family=Ubuntu:wght@400;500;700&display=swap" rel="stylesheet">
                </head>
                <style>
                    body {
                        font-family: 'Ubuntu', sans-serif;
                        background-color: #f5f5f5;
                    }
                
                    * {
                        box-sizing: border-box;
                    }
                
                    p:last-child {
                        margin-top: 0;
                    }
                
                    img {
                        max-width: 100%;
                    }
                </style>
                
                <body style="margin: 0; padding: 0;">
                    <table cellpadding="0" cellspacing="0" width="100%">
                        <tr>
                            <td style="padding: 20px 0 30px 0;">
                                <table align="center" cellpadding="0" cellspacing="0" width="600" style=" border-collapse: collapse; border: 1px solid #ececec; background-color: #fff;">
                                    <tr>
                                        <td align="center" style="position: relative;">
                                            <div
                                            class="company-logo-align"
                                            style=" padding: 2rem 2rem 1rem 2rem; display: flex; align-items: center; justify-content: center; margin: 0 auto;"
                                            align="center">
                                            </div>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td>
                                            <div class="user-information" 
                                            style="padding: 25px; background-color: #021f4c; width: 91.6%;"
                                            >
                                            <h1 align="center" style="color: #fff; font-size: 35px; font-weight: 500; margin: 0 0 1rem 0;">Hi ${replyTo}</h1>
                                            <p align="center" style="color: #fff; font-size: 30px; font-weight: 500; margin: 0 0 1rem 0;">Welcome to gps-tracker®</p>
                                            <span align="center" style="display: block; font-size: 16px; color: #fff;">Thank you for signing up on gps-tracker® </span>
                                            </div>
                                          
                                        </td>
                                        <td></td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 3rem 2rem 2rem 2rem;">
                                          <h2 align="center" style="color: #585d6a; font-size: 30px; ">Verify your Email Address</h2>
                                          <a href= "${link}" align="center" style="font-size: 40px; color: #585d6a; margin: 0;  margin-top: 0;">CLICK HERE</a>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 3rem 2rem 2rem 2rem;">
                                          <p align="center" style="color: #585d6a; font-size: 14px; margin: 0;">
                                             If you have any query, feel free to contact us at support@gps-tracker.com.
                                          </p>
                                        </td>
                                    </tr>
                                  
                                </table>
                            </td>
                        </tr>
                    </table>
                </body>
                
                </html>`,
    };
    transporter.sendMail(mailOptions, function (err, res) {
      if (err) {
        console.log("there was an error: ", err);
      } else {
        console.log("here is the res: ", res);
      }
    });

    return otp;
  },
};
