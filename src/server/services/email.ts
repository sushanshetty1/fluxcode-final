import nodemailer from "nodemailer";
import { env } from "~/env";

let transporterInstance: nodemailer.Transporter | null = null;

function getTransporter() {
  if (!transporterInstance && env.SMTP_HOST && env.SMTP_PORT && env.SMTP_USER && env.SMTP_PASSWORD) {
    console.log("✅ Creating email transporter with config:", {
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      user: env.SMTP_USER,
      hasPassword: !!env.SMTP_PASSWORD
    });
    transporterInstance = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: parseInt(env.SMTP_PORT),
      secure: false,
      auth: {
        user: env.SMTP_USER,
        pass: env.SMTP_PASSWORD,
      },
    });
  } else if (!transporterInstance) {
    console.error("❌ Cannot create email transporter - missing config:", {
      hasHost: !!env.SMTP_HOST,
      hasPort: !!env.SMTP_PORT,
      hasUser: !!env.SMTP_USER,
      hasPassword: !!env.SMTP_PASSWORD
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

export async function sendWeekendContestStart(
  email: string,
  data: {
    name: string;
    contestName: string;
    weekNumber: number;
    problems: Array<{ title: string; difficulty: string }>;
    contestUrl: string;
  }
) {
  const transporter = getTransporter();
  if (!transporter) {
    console.log("Email transporter not configured, skipping weekend contest start notification");
    return;
  }

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif; 
          line-height: 1.6; 
          background: linear-gradient(135deg, #000000 0%, #1a0033 100%);
          padding: 20px;
        }
        .container { 
          max-width: 600px; 
          margin: 0 auto; 
          background: rgba(0, 0, 0, 0.95);
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 20px 60px rgba(147, 51, 234, 0.3);
          border: 1px solid rgba(147, 51, 234, 0.2);
        }
        .header { 
          background: linear-gradient(135deg, #9333ea 0%, #6366f1 100%);
          color: white; 
          padding: 40px 30px; 
          text-align: center;
          position: relative;
          overflow: hidden;
        }
        .header::before {
          content: '';
          position: absolute;
          top: -50%;
          left: -50%;
          width: 200%;
          height: 200%;
          background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
          animation: spotlight 3s ease-in-out infinite;
        }
        @keyframes spotlight {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(20px, 20px); }
        }
        .header h1 { 
          font-size: 42px; 
          font-weight: 800; 
          text-transform: uppercase; 
          letter-spacing: -1px;
          margin-bottom: 10px;
          position: relative;
          z-index: 1;
        }
        .header .subtitle { 
          font-size: 18px; 
          opacity: 0.95; 
          font-weight: 300;
          position: relative;
          z-index: 1;
        }
        .badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          background: rgba(147, 51, 234, 0.1);
          border: 1px solid rgba(147, 51, 234, 0.3);
          border-radius: 20px;
          font-size: 14px;
          font-weight: 600;
          color: #a78bfa;
          margin-top: 15px;
        }
        .content { 
          padding: 40px 30px; 
          color: #e5e7eb;
        }
        .greeting { 
          font-size: 20px; 
          font-weight: 600; 
          color: #ffffff;
          margin-bottom: 20px;
        }
        .message { 
          font-size: 16px; 
          color: #d1d5db; 
          margin-bottom: 30px;
          line-height: 1.8;
        }
        .highlight { 
          color: #a78bfa; 
          font-weight: 600;
        }
        .problems-section {
          background: rgba(147, 51, 234, 0.05);
          border: 1px solid rgba(147, 51, 234, 0.2);
          border-radius: 12px;
          padding: 25px;
          margin: 30px 0;
        }
        .problems-title {
          font-size: 18px;
          font-weight: 700;
          color: #ffffff;
          margin-bottom: 20px;
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .problem-item {
          background: rgba(0, 0, 0, 0.4);
          border-left: 3px solid #9333ea;
          padding: 15px;
          margin-bottom: 12px;
          border-radius: 6px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .problem-item:last-child { margin-bottom: 0; }
        .problem-title {
          font-size: 15px;
          font-weight: 600;
          color: #f3f4f6;
        }
        .difficulty {
          padding: 4px 12px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
        }
        .difficulty-easy { background: rgba(34, 197, 94, 0.2); color: #86efac; }
        .difficulty-medium { background: rgba(251, 191, 36, 0.2); color: #fcd34d; }
        .difficulty-hard { background: rgba(239, 68, 68, 0.2); color: #fca5a5; }
        .cta-button { 
          display: inline-block; 
          background: linear-gradient(135deg, #9333ea 0%, #7c3aed 100%);
          color: white; 
          padding: 16px 40px; 
          text-decoration: none; 
          border-radius: 30px; 
          font-weight: 700;
          font-size: 16px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          box-shadow: 0 10px 30px rgba(147, 51, 234, 0.4);
          transition: all 0.3s ease;
        }
        .cta-wrapper {
          text-align: center;
          margin: 35px 0;
        }
        .info-box {
          background: rgba(99, 102, 241, 0.1);
          border: 1px solid rgba(99, 102, 241, 0.2);
          border-radius: 10px;
          padding: 20px;
          margin-top: 30px;
        }
        .info-box-title {
          font-size: 14px;
          font-weight: 700;
          color: #a5b4fc;
          margin-bottom: 10px;
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        .info-box-text {
          font-size: 14px;
          color: #c7d2fe;
          line-height: 1.6;
        }
        .footer { 
          text-align: center; 
          padding: 30px; 
          background: rgba(0, 0, 0, 0.5);
          color: #9ca3af; 
          font-size: 14px;
          border-top: 1px solid rgba(147, 51, 234, 0.1);
        }
        .footer-highlight {
          font-size: 16px;
          font-weight: 600;
          color: #d1d5db;
          margin-bottom: 8px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>⚡ WEEKEND TEST</h1>
          <p class="subtitle">Time to prove your skills!</p>
          <div class="badge">
            <span>🏁</span>
            <span>Week ${data.weekNumber} • Contest Started</span>
          </div>
        </div>
        
        <div class="content">
          <div class="greeting">Hi ${data.name}! 👋</div>
          
          <div class="message">
            The <span class="highlight">Weekend Contest</span> for Week ${data.weekNumber} of <strong>${data.contestName}</strong> has officially started! 
            It's time to put your skills to the test and compete with your peers.
          </div>

          <div class="problems-section">
            <div class="problems-title">
              <span>🎯</span>
              <span>Your Challenge (3 Problems)</span>
            </div>
            ${data.problems.map((problem, idx) => `
              <div class="problem-item">
                <div class="problem-title">${idx + 1}. ${problem.title}</div>
                <div class="difficulty difficulty-${problem.difficulty.toLowerCase()}">${problem.difficulty}</div>
              </div>
            `).join('')}
          </div>

          <div class="cta-wrapper">
            <a href="${data.contestUrl}" class="cta-button">Start Solving Now</a>
          </div>

          <div class="info-box">
            <div class="info-box-title">⏰ Important Deadline</div>
            <div class="info-box-text">
              Complete all 3 problems before <strong>Sunday 11:59 PM IST</strong> to avoid penalties and maintain your streak. 
              Late submissions will be marked and affect your contest standing.
            </div>
          </div>

          <div class="info-box" style="margin-top: 15px;">
            <div class="info-box-title">💰 Stakes</div>
            <div class="info-box-text">
              Remember: Incomplete problems mean penalty payments! Solve at least 2/3 problems to minimize penalties. 
              Complete all 3 to dominate the leaderboard! 🏆
            </div>
          </div>
        </div>
        
        <div class="footer">
          <div class="footer-highlight">Keep coding and stay consistent! 💪</div>
          <div>FluxCode Team</div>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    await transporter.sendMail({
      from: env.SMTP_USER,
      to: email,
      subject: `⚡ Weekend Contest Started - Week ${data.weekNumber} | ${data.contestName}`,
      html,
    });
    console.log(`Sent weekend contest start notification to ${email}`);
  } catch (error) {
    console.error("Error sending weekend contest start notification:", error);
  }
}

export async function sendWeekendReminderIncomplete(
  email: string,
  data: {
    name: string;
    contestName: string;
    weekNumber: number;
    solvedCount: number;
    totalProblems: number;
    unsolvedProblems: Array<{ title: string; difficulty: string }>;
    contestUrl: string;
  }
) {
  const transporter = getTransporter();
  if (!transporter) {
    console.log("Email transporter not configured, skipping weekend reminder");
    return;
  }

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif; 
          line-height: 1.6; 
          background: linear-gradient(135deg, #000000 0%, #1a0033 100%);
          padding: 20px;
        }
        .container { 
          max-width: 600px; 
          margin: 0 auto; 
          background: rgba(0, 0, 0, 0.95);
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 20px 60px rgba(239, 68, 68, 0.3);
          border: 1px solid rgba(239, 68, 68, 0.3);
        }
        .header { 
          background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%);
          color: white; 
          padding: 40px 30px; 
          text-align: center;
          position: relative;
          overflow: hidden;
        }
        .header::before {
          content: '';
          position: absolute;
          top: -50%;
          left: -50%;
          width: 200%;
          height: 200%;
          background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
          animation: pulse 2s ease-in-out infinite;
        }
        @keyframes pulse {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 1; }
        }
        .header h1 { 
          font-size: 42px; 
          font-weight: 800; 
          text-transform: uppercase; 
          letter-spacing: -1px;
          margin-bottom: 10px;
          position: relative;
          z-index: 1;
        }
        .header .subtitle { 
          font-size: 18px; 
          opacity: 0.95; 
          font-weight: 300;
          position: relative;
          z-index: 1;
        }
        .badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          background: rgba(239, 68, 68, 0.2);
          border: 1px solid rgba(239, 68, 68, 0.4);
          border-radius: 20px;
          font-size: 14px;
          font-weight: 600;
          color: #fca5a5;
          margin-top: 15px;
        }
        .content { 
          padding: 40px 30px; 
          color: #e5e7eb;
        }
        .greeting { 
          font-size: 20px; 
          font-weight: 600; 
          color: #ffffff;
          margin-bottom: 20px;
        }
        .message { 
          font-size: 16px; 
          color: #d1d5db; 
          margin-bottom: 30px;
          line-height: 1.8;
        }
        .highlight { 
          color: #fca5a5; 
          font-weight: 600;
        }
        .urgent-box {
          background: rgba(239, 68, 68, 0.1);
          border: 2px solid rgba(239, 68, 68, 0.3);
          border-radius: 12px;
          padding: 25px;
          margin: 30px 0;
          text-align: center;
        }
        .urgent-title {
          font-size: 24px;
          font-weight: 800;
          color: #fca5a5;
          margin-bottom: 10px;
        }
        .urgent-text {
          font-size: 16px;
          color: #f3f4f6;
          line-height: 1.6;
        }
        .stats {
          display: flex;
          justify-content: space-around;
          margin: 30px 0;
          padding: 20px;
          background: rgba(0, 0, 0, 0.4);
          border-radius: 12px;
        }
        .stat-item {
          text-align: center;
        }
        .stat-value {
          font-size: 36px;
          font-weight: 800;
          color: #ffffff;
          margin-bottom: 5px;
        }
        .stat-label {
          font-size: 12px;
          color: #9ca3af;
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        .problems-section {
          background: rgba(239, 68, 68, 0.05);
          border: 1px solid rgba(239, 68, 68, 0.2);
          border-radius: 12px;
          padding: 25px;
          margin: 30px 0;
        }
        .problems-title {
          font-size: 18px;
          font-weight: 700;
          color: #ffffff;
          margin-bottom: 20px;
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .problem-item {
          background: rgba(0, 0, 0, 0.4);
          border-left: 3px solid #dc2626;
          padding: 15px;
          margin-bottom: 12px;
          border-radius: 6px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .problem-item:last-child { margin-bottom: 0; }
        .problem-title {
          font-size: 15px;
          font-weight: 600;
          color: #f3f4f6;
        }
        .difficulty {
          padding: 4px 12px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
        }
        .difficulty-easy { background: rgba(34, 197, 94, 0.2); color: #86efac; }
        .difficulty-medium { background: rgba(251, 191, 36, 0.2); color: #fcd34d; }
        .difficulty-hard { background: rgba(239, 68, 68, 0.2); color: #fca5a5; }
        .cta-button { 
          display: inline-block; 
          background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%);
          color: white; 
          padding: 16px 40px; 
          text-decoration: none; 
          border-radius: 30px; 
          font-weight: 700;
          font-size: 16px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          box-shadow: 0 10px 30px rgba(239, 68, 68, 0.4);
          transition: all 0.3s ease;
        }
        .cta-wrapper {
          text-align: center;
          margin: 35px 0;
        }
        .footer { 
          text-align: center; 
          padding: 30px; 
          background: rgba(0, 0, 0, 0.5);
          color: #9ca3af; 
          font-size: 14px;
          border-top: 1px solid rgba(239, 68, 68, 0.1);
        }
        .footer-highlight {
          font-size: 16px;
          font-weight: 600;
          color: #d1d5db;
          margin-bottom: 8px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>⚠️ URGENT REMINDER</h1>
          <p class="subtitle">Time is running out!</p>
          <div class="badge">
            <span>⏰</span>
            <span>Deadline: Today 11:59 PM IST</span>
          </div>
        </div>
        
        <div class="content">
          <div class="greeting">Hi ${data.name}! 🚨</div>
          
          <div class="message">
            It's <span class="highlight">Sunday 6:00 PM</span> and you have <strong>less than 6 hours</strong> remaining to complete 
            the Weekend Contest for Week ${data.weekNumber} of <strong>${data.contestName}</strong>.
          </div>

          <div class="urgent-box">
            <div class="urgent-title">⚠️ PENALTY ALERT</div>
            <div class="urgent-text">
              Incomplete problems will result in penalty payments! Don't let your money go to waste.
            </div>
          </div>

          <div class="stats">
            <div class="stat-item">
              <div class="stat-value">${data.solvedCount}</div>
              <div class="stat-label">Solved</div>
            </div>
            <div class="stat-item">
              <div class="stat-value">${data.totalProblems - data.solvedCount}</div>
              <div class="stat-label">Remaining</div>
            </div>
            <div class="stat-item">
              <div class="stat-value">&lt;6h</div>
              <div class="stat-label">Time Left</div>
            </div>
          </div>

          ${data.unsolvedProblems.length > 0 ? `
            <div class="problems-section">
              <div class="problems-title">
                <span>❌</span>
                <span>Unsolved Problems</span>
              </div>
              ${data.unsolvedProblems.map((problem, idx) => `
                <div class="problem-item">
                  <div class="problem-title">${idx + 1}. ${problem.title}</div>
                  <div class="difficulty difficulty-${problem.difficulty.toLowerCase()}">${problem.difficulty}</div>
                </div>
              `).join('')}
            </div>
          ` : ''}

          <div class="cta-wrapper">
            <a href="${data.contestUrl}" class="cta-button">Complete Now</a>
          </div>

          <div class="message" style="text-align: center; margin-top: 30px; font-size: 15px; color: #fca5a5;">
            💡 <strong>Pro Tip:</strong> Even solving 2 out of 3 problems will significantly reduce your penalty!
          </div>
        </div>
        
        <div class="footer">
          <div class="footer-highlight">You've got this! 💪</div>
          <div>FluxCode Team</div>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    await transporter.sendMail({
      from: env.SMTP_USER,
      to: email,
      subject: `⚠️ URGENT: ${data.totalProblems - data.solvedCount} Problems Remaining - Deadline Tonight!`,
      html,
    });
    console.log(`Sent weekend reminder to ${email} - ${data.solvedCount}/${data.totalProblems} solved`);
  } catch (error) {
    console.error("Error sending weekend reminder:", error);
  }
}
