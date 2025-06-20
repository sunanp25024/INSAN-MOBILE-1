#!/usr/bin/env node

/**
 * INSAN MOBILE - Production Deployment Script
 * Automated deployment to Vercel with environment validation
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logStep(step, message) {
  log(`\n🚀 Step ${step}: ${message}`, 'cyan');
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

// Required environment variables for production
const requiredEnvVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'NEXT_PUBLIC_APP_URL',
  'NEXT_PUBLIC_VAPID_PUBLIC_KEY',
  'VAPID_PRIVATE_KEY'
];

function checkEnvironmentVariables() {
  logStep(1, 'Checking Environment Variables');
  
  const missingVars = [];
  
  // Check if .env.local exists
  const envPath = path.join(process.cwd(), '.env.local');
  if (!fs.existsSync(envPath)) {
    logWarning('.env.local file not found. Make sure environment variables are set in Vercel dashboard.');
    return true; // Continue deployment, vars might be set in Vercel
  }
  
  // Read and parse .env.local
  const envContent = fs.readFileSync(envPath, 'utf8');
  const envVars = {};
  
  envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
      envVars[key.trim()] = value.trim();
    }
  });
  
  // Check required variables
  requiredEnvVars.forEach(varName => {
    if (!envVars[varName] || envVars[varName] === 'your_value_here') {
      missingVars.push(varName);
    }
  });
  
  if (missingVars.length > 0) {
    logError('Missing or incomplete environment variables:');
    missingVars.forEach(varName => {
      log(`  - ${varName}`, 'red');
    });
    log('\nPlease set these variables in Vercel dashboard or update .env.local', 'yellow');
    return false;
  }
  
  logSuccess('All required environment variables are configured');
  return true;
}

function runBuildTest() {
  logStep(2, 'Running Production Build Test');
  
  try {
    log('Building application...', 'blue');
    execSync('npm run build', { stdio: 'inherit' });
    logSuccess('Build completed successfully');
    return true;
  } catch (error) {
    logError('Build failed. Please fix the errors before deploying.');
    return false;
  }
}

function checkVercelCLI() {
  logStep(3, 'Checking Vercel CLI');
  
  try {
    execSync('vercel --version', { stdio: 'pipe' });
    logSuccess('Vercel CLI is installed');
    return true;
  } catch (error) {
    logWarning('Vercel CLI not found. Installing...');
    try {
      execSync('npm install -g vercel', { stdio: 'inherit' });
      logSuccess('Vercel CLI installed successfully');
      return true;
    } catch (installError) {
      logError('Failed to install Vercel CLI. Please install manually: npm install -g vercel');
      return false;
    }
  }
}

function deployToVercel() {
  logStep(4, 'Deploying to Vercel');
  
  try {
    log('Deploying to production...', 'blue');
    
    // Check if user is logged in
    try {
      execSync('vercel whoami', { stdio: 'pipe' });
    } catch (error) {
      log('Please login to Vercel first:', 'yellow');
      execSync('vercel login', { stdio: 'inherit' });
    }
    
    // Deploy to production
    const deployOutput = execSync('vercel --prod --yes', { encoding: 'utf8' });
    
    // Extract deployment URL
    const urlMatch = deployOutput.match(/https:\/\/[^\s]+/);
    const deploymentUrl = urlMatch ? urlMatch[0] : 'Deployment completed';
    
    logSuccess(`Deployment successful!`);
    log(`🌐 Production URL: ${deploymentUrl}`, 'green');
    
    return deploymentUrl;
  } catch (error) {
    logError('Deployment failed. Please check the error messages above.');
    return false;
  }
}

function runPostDeploymentTests(deploymentUrl) {
  logStep(5, 'Running Post-Deployment Tests');
  
  if (!deploymentUrl || deploymentUrl === true) {
    logWarning('Skipping tests - deployment URL not available');
    return;
  }
  
  log('Testing deployment...', 'blue');
  
  // Basic connectivity test
  try {
    const https = require('https');
    const url = new URL(deploymentUrl);
    
    https.get(deploymentUrl, (res) => {
      if (res.statusCode === 200) {
        logSuccess('Deployment is accessible');
      } else {
        logWarning(`Deployment returned status code: ${res.statusCode}`);
      }
    }).on('error', (err) => {
      logWarning(`Could not test deployment: ${err.message}`);
    });
  } catch (error) {
    logWarning('Could not run connectivity test');
  }
  
  // Manual test checklist
  log('\n📋 Manual Testing Checklist:', 'cyan');
  log('  □ Login functionality', 'blue');
  log('  □ Dashboard loading', 'blue');
  log('  □ Database connectivity', 'blue');
  log('  □ PWA installation', 'blue');
  log('  □ Push notifications', 'blue');
  log('  □ Mobile responsiveness', 'blue');
}

function generateDeploymentReport(deploymentUrl) {
  logStep(6, 'Generating Deployment Report');
  
  const report = {
    timestamp: new Date().toISOString(),
    deploymentUrl: deploymentUrl || 'Not available',
    version: require('./package.json').version,
    nodeVersion: process.version,
    platform: process.platform,
    status: 'completed'
  };
  
  const reportPath = path.join(process.cwd(), 'deployment-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  logSuccess(`Deployment report saved to: ${reportPath}`);
}

function showNextSteps(deploymentUrl) {
  log('\n🎉 Deployment Complete!', 'green');
  log('\n📋 Next Steps:', 'cyan');
  log('1. Test all functionality on the production URL', 'blue');
  log('2. Set up monitoring and alerts', 'blue');
  log('3. Configure custom domain (if needed)', 'blue');
  log('4. Share the URL with your team', 'blue');
  log('5. Set up user accounts and initial data', 'blue');
  
  if (deploymentUrl && deploymentUrl !== true) {
    log(`\n🌐 Production URL: ${deploymentUrl}`, 'green');
    log(`📱 PWA Install: Available on all supported browsers`, 'green');
    log(`🔧 Admin Panel: ${deploymentUrl}/dashboard`, 'green');
  }
  
  log('\n📚 Documentation:', 'cyan');
  log('  - PRODUCTION-DEPLOYMENT.md - Complete deployment guide', 'blue');
  log('  - ENVIRONMENT-SETUP.md - Environment variables setup', 'blue');
  log('  - README.md - General project information', 'blue');
}

// Main deployment function
async function main() {
  log('🚀 INSAN MOBILE - Production Deployment', 'bright');
  log('==========================================', 'bright');
  
  const startTime = Date.now();
  
  // Step 1: Check environment variables
  if (!checkEnvironmentVariables()) {
    process.exit(1);
  }
  
  // Step 2: Run build test
  if (!runBuildTest()) {
    process.exit(1);
  }
  
  // Step 3: Check Vercel CLI
  if (!checkVercelCLI()) {
    process.exit(1);
  }
  
  // Step 4: Deploy to Vercel
  const deploymentUrl = deployToVercel();
  if (!deploymentUrl) {
    process.exit(1);
  }
  
  // Step 5: Run post-deployment tests
  runPostDeploymentTests(deploymentUrl);
  
  // Step 6: Generate report
  generateDeploymentReport(deploymentUrl);
  
  // Show next steps
  showNextSteps(deploymentUrl);
  
  const endTime = Date.now();
  const duration = Math.round((endTime - startTime) / 1000);
  
  log(`\n⏱️  Total deployment time: ${duration} seconds`, 'green');
  log('\n✅ Deployment completed successfully!', 'bright');
}

// Handle errors
process.on('uncaughtException', (error) => {
  logError(`Uncaught exception: ${error.message}`);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logError(`Unhandled rejection: ${reason}`);
  process.exit(1);
});

// Run the deployment
if (require.main === module) {
  main().catch((error) => {
    logError(`Deployment failed: ${error.message}`);
    process.exit(1);
  });
}

module.exports = {
  checkEnvironmentVariables,
  runBuildTest,
  checkVercelCLI,
  deployToVercel,
  runPostDeploymentTests
};