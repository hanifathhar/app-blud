import nodemailer from "nodemailer";

async function test() {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  try {
    await transporter.verify();
    console.log("✅ Terhubung ke server email.");
  } catch (err) {
    console.error("❌ Gagal terhubung:", err);
  }
}

test();
