/** Repeatable local API smoke journeys. Uses only iti-hub-test, never the live DB.
 * Run from server: node scripts/smokeAudit.js
 * Covers open group ownership, requests, approval and membership; track
 * enrollment, folder/record/file scope; auth registration/login/Google/reset.
 * SMTP delivery, Google consent and external file hosting are NOT smoke-tested.
 */
process.env.NODE_ENV = 'test';
const path = require('path');
process.chdir(path.resolve(__dirname, '..'));
const Jasmine = require('jasmine');
const runner = new Jasmine();
runner.loadConfig({
  spec_dir: 'spec',
  spec_files: [
    'middlewares/checkRoles.spec.js',
    'utils/sendEmail.spec.js',
    'integration/workOrder.integration.spec.js',
    'controllers/auth/registerController.spec.js',
    'controllers/auth/loginController.spec.js',
    'controllers/auth/googleAuthController.spec.js',
    'controllers/auth/passwordResetController.spec.js',
  ],
  helpers: [],
  random: false,
});
runner.execute();
