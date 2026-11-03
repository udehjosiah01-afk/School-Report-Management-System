const { applicationDefault, cert, initializeApp } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");

const projectId = process.env.CBT_FIREBASE_PROJECT_ID;
if (!projectId) {
  throw new Error("CBT_FIREBASE_PROJECT_ID must identify the dedicated CBT Firebase project.");
}

let credential = applicationDefault();
if (process.env.CBT_FIREBASE_SERVICE_ACCOUNT) {
  let serviceAccount;
  try {
    serviceAccount = JSON.parse(process.env.CBT_FIREBASE_SERVICE_ACCOUNT);
  } catch {
    throw new Error("CBT_FIREBASE_SERVICE_ACCOUNT must contain valid JSON.");
  }
  if (serviceAccount.project_id !== projectId) {
    throw new Error("The CBT service account project_id must match CBT_FIREBASE_PROJECT_ID.");
  }
  credential = cert(serviceAccount);
}

const app = initializeApp({ credential, projectId }, "cbt");
const db = getFirestore(app);

module.exports = { app, db };
