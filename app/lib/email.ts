import nodemailer from "nodemailer";
import fs from "fs";
import path from "path";
import Handlebars from "handlebars";

// Configure email transporter
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_SERVER_HOST || "smtp.gmail.com",
  port: Number(process.env.EMAIL_SERVER_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_SERVER_USER || "asharnadeem002@gmail.com",
    pass: process.env.EMAIL_SERVER_PASSWORD || "zpnimmsuhefwswcb",
  },
});

// Helper function to read email templates
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

// Fallback templates
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
    default:
      return `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
          <h2 style="color: #333; text-align: center;">SnapTrace Notification</h2>
          <p style="color: #666; font-size: 16px;">{{message}}</p>
        </div>
      `;
  }
};

// Get email templates and compile with Handlebars
const compileTemplate = (
  templateName: string,
  context: Record<string, string | number>
) => {
  const template = getEmailTemplate(templateName);
  const compiledTemplate = Handlebars.compile(template);
  return compiledTemplate(context);
};

// Email templates with Handlebars
const getEmailContent = (
  template:
    | "verification"
    | "login"
    | "passwordReset"
    | "accountApproved"
    | "subscriptionConfirmation",
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
  };

  return {
    subject: subjects[template],
    html: compileTemplate(template, context),
  };
};

// Send email function
export async function sendEmail(
  to: string,
  template:
    | "verification"
    | "login"
    | "passwordReset"
    | "accountApproved"
    | "subscriptionConfirmation",
  context: Record<string, string | number> = {}
) {
  try {
    const fromEmail =
      process.env.EMAIL_FROM || "SnapTrace <asharnadeem002@gmail.com>";
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

// Generate a random verification token (6 digits)
export function generateVerificationToken() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}
