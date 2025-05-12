import nodemailer from "nodemailer";
import fs from "fs";
import path from "path";
import Handlebars from "handlebars";

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_SERVER_HOST || "smtp.gmail.com",
  port: Number(process.env.EMAIL_SERVER_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_SERVER_USER || "abdullahshoukat662@gmail.com",
    pass: process.env.EMAIL_SERVER_PASSWORD || "jiwlimqbniteotoo",
  },
});

const getEmailTemplate = (templateName: string) => {
  const templatePath = path.join(
    process.cwd(),
    "emails",
    `${templateName}.html`
  );
  try {
    if (fs.existsSync(templatePath)) {
      return fs.readFileSync(templatePath, "utf8");
    }
    console.warn(
      `Template file ${templatePath} not found, using fallback template`
    );
    return getFallbackTemplate(templateName);
  } catch (error) {
    console.error(`Error reading template file: ${error}`);
    return getFallbackTemplate(templateName);
  }
};

const getFallbackTemplate = (templateType: string) => {
  switch (templateType) {
    case "verification":
      return `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
          <h2 style="color: #333; text-align: center;">Welcome to SnapTrace!</h2>
          <p style="color: #666; font-size: 16px;">To complete your registration, please verify your email by entering the verification code below:</p>
          <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; text-align: center; margin: 20px 0;">
            <h3 style="color: #007bff; font-size: 24px; margin: 0;">{{token}}</h3>
          </div>
          <p style="color: #666; font-size: 14px;">This code will expire in 24 hours.</p>
          <p style="color: #666; font-size: 14px;">If you did not request this verification, please ignore this email.</p>
        </div>
      `;
    case "login":
      return `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
          <h2 style="color: #333; text-align: center;">SnapTrace Login Request</h2>
          <p style="color: #666; font-size: 16px;">To complete your login, please enter the verification code below:</p>
          <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; text-align: center; margin: 20px 0;">
            <h3 style="color: #007bff; font-size: 24px; margin: 0;">{{token}}</h3>
          </div>
          <p style="color: #666; font-size: 14px;">This code will expire in 15 minutes.</p>
          <p style="color: #666; font-size: 14px;">If you did not attempt to log in, please reset your password immediately.</p>
        </div>
      `;
    case "passwordReset":
      return `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
          <h2 style="color: #333; text-align: center;">Password Reset Request</h2>
          <p style="color: #666; font-size: 16px;">To reset your password, please enter the verification code below:</p>
          <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; text-align: center; margin: 20px 0;">
            <h3 style="color: #007bff; font-size: 24px; margin: 0;">{{token}}</h3>
          </div>
          <p style="color: #666; font-size: 14px;">This code will expire in 1 hour.</p>
          <p style="color: #666; font-size: 14px;">If you did not request a password reset, please ignore this email.</p>
        </div>
      `;
    case "accountApproved":
      return `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
          <h2 style="color: #333; text-align: center;">Account Approved!</h2>
          <p style="color: #666; font-size: 16px;">We are pleased to inform you that your SnapTrace account has been approved by an administrator.</p>
          <p style="color: #666; font-size: 16px;">You can now log in to your account and start using all the features of SnapTrace.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${
              process.env.NEXTAUTH_URL || "http://localhost:3000"
            }/login" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">Log In Now</a>
          </div>
          <p style="color: #666; font-size: 14px;">Thank you for choosing SnapTrace!</p>
        </div>
      `;
    case "subscriptionConfirmation":
      return `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
          <h2 style="color: #333; text-align: center;">Subscription Confirmed!</h2>
          <p style="color: #666; font-size: 16px;">Thank you for subscribing to the {{plan}} plan on SnapTrace.</p>
          <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h3 style="color: #007bff; text-align: center;">Subscription Details</h3>
            <p style="margin: 10px 0;"><strong>Plan:</strong> {{plan}}</p>
            <p style="margin: 10px 0;"><strong>Start Date:</strong> {{startDate}}</p>
            <p style="margin: 10px 0;"><strong>End Date:</strong> {{endDate}}</p>
          </div>
          <p style="color: #666; font-size: 14px;">We hope you enjoy all the features of your subscription. If you have any questions, please contact our support team.</p>
        </div>
      `;
    case "subscriptionApproved":
      return `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
          <h2 style="color: #333; text-align: center;">Subscription Approved!</h2>
          <p style="color: #666; font-size: 16px;">Great news! Your subscription request for the {{plan}} plan has been approved by our admin team.</p>
          <div style="background-color: #f0f7ff; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h3 style="color: #007bff; text-align: center;">Subscription Details</h3>
            <p style="margin: 10px 0;"><strong>Plan:</strong> {{plan}}</p>
            <p style="margin: 10px 0;"><strong>Status:</strong> Active</p>
            <p style="margin: 10px 0;"><strong>Start Date:</strong> {{startDate}}</p>
            <p style="margin: 10px 0;"><strong>End Date:</strong> {{endDate}}</p>
            <p style="margin: 10px 0;"><strong>Payment Method:</strong> {{paymentMethod}}</p>
          </div>
          <p style="color: #666; font-size: 16px;">You now have full access to all features included in your subscription plan. Login to your account to start exploring!</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${
              process.env.NEXTAUTH_URL || "http://localhost:3000"
            }/dashboard" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">Go to Dashboard</a>
          </div>
        </div>
      `;
    case "subscriptionRejected":
      return `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
          <h2 style="color: #333; text-align: center;">Subscription Request Not Approved</h2>
          <p style="color: #666; font-size: 16px;">We're writing to inform you that your subscription request for the {{plan}} plan was not approved at this time.</p>
          <div style="background-color: #fee2e2; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h3 style="color: #ef4444; text-align: center;">Subscription Details</h3>
            <p style="margin: 10px 0;">You requested the <strong>{{plan}}</strong> plan on <strong>{{requestDate}}</strong>.</p>
          </div>
          {{#if rejectionReason}}
          <p style="color: #666; font-size: 16px;">The admin provided the following reason:</p>
          <div style="background-color: #f3f4f6; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p style="font-style: italic; color: #4b5563;">{{rejectionReason}}</p>
          </div>
          {{/if}}
          <p style="color: #666; font-size: 16px;">You can contact our support team for more information or resubmit your subscription request after addressing any issues mentioned above.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${
              process.env.NEXTAUTH_URL || "http://localhost:3000"
            }/subscription" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">View Subscription Options</a>
          </div>
        </div>
      `;
    case "accountDeactivated":
      return `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
          <h2 style="color: #333; text-align: center;">Account Deactivated</h2>
          <p style="color: #666; font-size: 16px;">We regret to inform you that your SnapTrace account has been deactivated by an administrator.</p>
          <div style="background-color: #fee2e2; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h3 style="color: #ef4444; text-align: center;">Account Status: Deactivated</h3>
            <p style="margin: 10px 0;">You will no longer be able to log in to your account until it is reactivated by an administrator.</p>
          </div>
          {{#if deactivationReason}}
          <p style="color: #666; font-size: 16px;">The administrator provided the following reason:</p>
          <div style="background-color: #f3f4f6; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p style="font-style: italic; color: #4b5563;">{{deactivationReason}}</p>
          </div>
          {{/if}}
          <p style="color: #666; font-size: 16px;">If you believe this was done in error or would like to request reactivation of your account, please click the button below to submit a reactivation request. Our admin team will review your request.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${
              process.env.NEXTAUTH_URL || "http://localhost:3000"
            }/request-reactivation" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">Request Reactivation</a>
          </div>
        </div>
      `;
    case "accountReactivated":
      return `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
          <h2 style="color: #333; text-align: center;">Account Reactivated!</h2>
          <p style="color: #666; font-size: 16px;">Great news! Your SnapTrace account has been reactivated by an administrator.</p>
          <div style="background-color: #e6f5e6; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h3 style="color: #22c55e; text-align: center;">Account Status: Active</h3>
            <p style="margin: 10px 0;">You can now log in to your account and continue using all SnapTrace features.</p>
          </div>
          <p style="color: #666; font-size: 16px;">We're glad to have you back on the platform. If you encounter any issues with your account, please don't hesitate to contact our support team.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${
              process.env.NEXTAUTH_URL || "http://localhost:3000"
            }/login" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">Log In Now</a>
          </div>
        </div>
      `;
    default:
      return `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
          <h2 style="color: #333; text-align: center;">SnapTrace Notification</h2>
          <p style="color: #666; font-size: 16px;">{{message}}</p>
        </div>
      `;
  }
};

const compileTemplate = (
  templateName: string,
  context: Record<string, string | number>
) => {
  const template = getEmailTemplate(templateName);
  const compiledTemplate = Handlebars.compile(template);
  return compiledTemplate(context);
};

const getEmailContent = (
  template:
    | "verification"
    | "login"
    | "passwordReset"
    | "accountApproved"
    | "subscriptionConfirmation"
    | "subscriptionApproved"
    | "subscriptionRejected"
    | "accountDeactivated"
    | "accountReactivated",
  context: Record<string, string | number>
) => {
  const subjects = {
    verification: "Verify your SnapTrace account",
    login: "SnapTrace Login Verification",
    passwordReset: "Reset Your SnapTrace Password",
    accountApproved: "Your SnapTrace Account Has Been Approved",
    subscriptionConfirmation: `Your SnapTrace ${
      context.plan || "Premium"
    } Subscription is Confirmed`,
    subscriptionApproved: `Your SnapTrace ${
      context.plan || "Premium"
    } Subscription is Approved`,
    subscriptionRejected: `Your SnapTrace ${
      context.plan || "Premium"
    } Subscription Request Declined`,
    accountDeactivated: "Your SnapTrace Account Has Been Deactivated",
    accountReactivated: "Your SnapTrace Account Has Been Reactivated",
  };

  return {
    subject: subjects[template],
    html: compileTemplate(template, context),
  };
};

export async function sendEmail(
  to: string,
  template:
    | "verification"
    | "login"
    | "passwordReset"
    | "accountApproved"
    | "subscriptionConfirmation"
    | "subscriptionApproved"
    | "subscriptionRejected"
    | "accountDeactivated"
    | "accountReactivated",
  context: Record<string, string | number> = {}
) {
  try {
    const fromEmail =
      process.env.EMAIL_FROM || "SnapTrace <abdullahshoukat662@gmail.com>";
    const emailContent = getEmailContent(template, context);

    const info = await transporter.sendMail({
      from: fromEmail,
      to,
      subject: emailContent.subject,
      html: emailContent.html,
    });

    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("Email sending failed:", error);
    return { success: false, error };
  }
}

export function generateVerificationToken() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}
