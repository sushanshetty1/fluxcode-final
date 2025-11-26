import nodemailer from "nodemailer";
import { env } from "~/env";

let transporterInstance: nodemailer.Transporter | null = null;

function getTransporter() {
  if (!transporterInstance && env.SMTP_HOST && env.SMTP_PORT && env.SMTP_USER && env.SMTP_PASSWORD) {
    transporterInstance = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: parseInt(env.SMTP_PORT),
      secure: false,
      auth: {
        user: env.SMTP_USER,
        pass: env.SMTP_PASSWORD,
      },
    });
  }
  return transporterInstance;
}

export async function sendWeeklySummary(
  email: string,
  data: {
    name: string;
    problemsSolved: number;
    currentStreak: number;
    topTopics: Array<{ topic: string; count: number }>;
  }
) {
  const transporter = getTransporter();
  if (!transporter) return;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #4f46e5; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9fafb; }
        .stat { margin: 15px 0; padding: 15px; background: white; border-radius: 8px; }
        .stat-label { color: #6b7280; font-size: 14px; }
        .stat-value { color: #111827; font-size: 24px; font-weight: bold; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>📊 Your Weekly Progress</h1>
        </div>
        <div class="content">
          <p>Hi ${data.name},</p>
          <p>Here's your weekly coding progress summary:</p>
          
          <div class="stat">
            <div class="stat-label">Problems Solved This Week</div>
            <div class="stat-value">${data.problemsSolved}</div>
          </div>
          
          <div class="stat">
            <div class="stat-label">Current Streak</div>
            <div class="stat-value">${data.currentStreak} days 🔥</div>
          </div>
          
          <div class="stat">
            <div class="stat-label">Top Topics</div>
            ${data.topTopics.map((t) => `<div>${t.topic}: ${t.count} problems</div>`).join("")}
          </div>
          
          <p>Keep up the great work! 💪</p>
        </div>
      </div>
    </body>
    </html>
  `;

  await transporter.sendMail({
    from: env.SMTP_USER,
    to: email,
    subject: "Your Weekly Coding Progress",
    html,
  });
}

export async function sendStreakReminder(email: string, name: string) {
  const transporter = getTransporter();
  if (!transporter) return;

  const html = `
    <!DOCTYPE html>
    <html>
    <body style="font-family: Arial, sans-serif; padding: 20px;">
      <div style="max-width: 600px; margin: 0 auto;">
        <h2>🔥 Don't Break Your Streak!</h2>
        <p>Hi ${name},</p>
        <p>Just a friendly reminder that you haven't solved a problem today.</p>
        <p>Keep your streak alive by solving at least one problem!</p>
        <p><a href="${process.env.NEXTAUTH_URL}/dashboard" style="background: #4f46e5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Start Solving</a></p>
      </div>
    </body>
    </html>
  `;

  await transporter.sendMail({
    from: env.SMTP_USER,
    to: email,
    subject: "Don't Break Your Streak! 🔥",
    html,
  });
}

export async function sendMissedProblemNotification(
  email: string,
  data: {
    name: string;
    problemTitle: string;
    problemUrl: string;
    topicName: string;
    contestName: string;
  }
) {
  const transporter = getTransporter();
  if (!transporter) {
    console.log("Email transporter not configured, skipping missed problem notification");
    return;
  }

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; background-color: #f3f4f6; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px 20px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { padding: 30px; background: white; border-radius: 0 0 10px 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .problem-box { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 5px; }
        .cta-button { display: inline-block; background: #4f46e5; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin-top: 20px; font-weight: bold; }
        .cta-button:hover { background: #4338ca; }
        .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>⚠️ Missed Problem Alert</h1>
        </div>
        <div class="content">
          <p>Hi ${data.name},</p>
          <p>You have a missed problem that was unlocked but not completed in the <strong>${data.contestName}</strong> contest.</p>
          
          <div class="problem-box">
            <h3 style="margin-top: 0; color: #92400e;">📝 ${data.problemTitle}</h3>
            <p style="margin: 5px 0;"><strong>Topic:</strong> ${data.topicName}</p>
            <p style="margin: 5px 0; color: #78716c;">This problem was available but not completed before the topic ended.</p>
          </div>
          
          <p>Don't worry! You can still practice this problem to improve your skills:</p>
          
          <a href="${data.problemUrl}" class="cta-button">Solve Problem Now</a>
          
          <p style="margin-top: 30px; color: #6b7280; font-size: 14px;">
            💡 <strong>Tip:</strong> Keep track of daily unlocked problems to maintain your progress and avoid missing any challenges!
          </p>
        </div>
        <div class="footer">
          <p>Keep coding and stay consistent! 💪</p>
          <p>FluxCode Team</p>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    await transporter.sendMail({
      from: env.SMTP_USER,
      to: email,
      subject: `⚠️ Missed Problem: ${data.problemTitle}`,
      html,
    });
    console.log(`Sent missed problem notification to ${email} for problem: ${data.problemTitle}`);
  } catch (error) {
    console.error("Error sending missed problem notification:", error);
  }
}
