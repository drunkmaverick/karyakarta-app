#!/usr/bin/env ts-node

const { execSync } = require('child_process');
const { readFileSync, writeFileSync, existsSync } = require('fs');
const { join } = require('path');

interface Commit {
  hash: string;
  message: string;
  author: string;
  date: string;
  type: string;
  scope?: string;
  description: string;
  breaking?: boolean;
}

interface ReleaseNotes {
  version: string;
  date: string;
  commits: Commit[];
  features: string[];
  fixes: string[];
  breaking: string[];
  other: string[];
  paymentStatus: string;
}

class ReleaseNotesGenerator {
  private repoPath: string;
  private packageJson: any;

  constructor() {
    this.repoPath = process.cwd();
    this.loadPackageJson();
  }

  private loadPackageJson() {
    const packagePath = join(this.repoPath, 'package.json');
    if (existsSync(packagePath)) {
      this.packageJson = JSON.parse(readFileSync(packagePath, 'utf-8'));
    } else {
      this.packageJson = { name: 'Karyakarta', version: '1.0.0' };
    }
  }

  private getLastTag(): string | null {
    try {
      const lastTag = execSync('git describe --tags --abbrev=0', { 
        cwd: this.repoPath,
        encoding: 'utf-8' 
      }).trim();
      return lastTag;
    } catch (error) {
      console.log('No previous tags found, using all commits');
      return null;
    }
  }

  private getCommitsSinceTag(tag: string | null): Commit[] {
    try {
      const range = tag ? `${tag}..HEAD` : 'HEAD';
      const gitLog = execSync(
        `git log --pretty=format:"%H|%s|%an|%ad" --date=short ${range}`,
        { cwd: this.repoPath, encoding: 'utf-8' }
      );

      return gitLog
        .trim()
        .split('\n')
        .filter((line: string) => line.trim())
        .map((line: string) => this.parseCommitLine(line))
        .filter((commit: Commit | null) => commit !== null) as Commit[];
    } catch (error) {
      console.error('Error fetching commits:', error);
      return [];
    }
  }

  private parseCommitLine(line: string): Commit | null {
    const [hash, message, author, date] = line.split('|');
    
    if (!hash || !message) return null;

    // Parse conventional commit format
    const conventionalMatch = message.match(/^(\w+)(?:\(([^)]+)\))?(!)?: (.+)$/);
    
    if (conventionalMatch) {
      const [, type, scope, breaking, description] = conventionalMatch;
      return {
        hash: hash.substring(0, 8),
        message,
        author,
        date,
        type: type.toLowerCase(),
        scope,
        description,
        breaking: !!breaking
      };
    }

    // Fallback for non-conventional commits
    return {
      hash: hash.substring(0, 8),
      message,
      author,
      date,
      type: 'other',
      description: message,
      breaking: false
    };
  }

  private categorizeCommits(commits: Commit[]): {
    features: string[];
    fixes: string[];
    breaking: string[];
    other: string[];
  } {
    const features: string[] = [];
    const fixes: string[] = [];
    const breaking: string[] = [];
    const other: string[] = [];

    commits.forEach(commit => {
      const entry = `- ${commit.description} (${commit.hash})`;
      
      if (commit.breaking) {
        breaking.push(entry);
      } else {
        switch (commit.type) {
          case 'feat':
          case 'feature':
            features.push(entry);
            break;
          case 'fix':
          case 'bugfix':
            fixes.push(entry);
            break;
          default:
            other.push(entry);
        }
      }
    });

    return { features, fixes, breaking, other };
  }

  private getPaymentStatus(): string {
    try {
      // Check environment variables
      const envLocalPath = join(this.repoPath, '.env.local');
      const envExamplePath = join(this.repoPath, '.env.example');
      
      let paymentsEnabled = false;
      
      // Check .env.local first
      if (existsSync(envLocalPath)) {
        const envContent = readFileSync(envLocalPath, 'utf-8');
        if (envContent.includes('NEXT_PUBLIC_PAYMENTS_ENABLED=true')) {
          paymentsEnabled = true;
        } else if (envContent.includes('NEXT_PUBLIC_PAYMENTS_ENABLED=false')) {
          return '⚠️ Payments disabled for initial rollout';
        }
      }
      
      // If not found in .env.local, check .env.example
      if (!paymentsEnabled && existsSync(envExamplePath)) {
        const envContent = readFileSync(envExamplePath, 'utf-8');
        paymentsEnabled = envContent.includes('NEXT_PUBLIC_PAYMENTS_ENABLED=true');
      }

      return paymentsEnabled 
        ? '✅ Payments enabled for this release'
        : '⚠️ Payments disabled for initial rollout';
    } catch (error) {
      return '❓ Payment status unknown';
    }
  }

  private generateMarkdown(releaseNotes: ReleaseNotes): string {
    const { version, date, features, fixes, breaking, other, paymentStatus } = releaseNotes;
    
    let markdown = `# Release Notes - v${version}\n\n`;
    markdown += `**Release Date:** ${date}\n\n`;
    
    // Payment status
    markdown += `## Payment Status\n\n`;
    markdown += `${paymentStatus}\n\n`;
    
    // Breaking changes
    if (breaking.length > 0) {
      markdown += `## ⚠️ Breaking Changes\n\n`;
      breaking.forEach(item => markdown += `${item}\n`);
      markdown += '\n';
    }
    
    // New features
    if (features.length > 0) {
      markdown += `## ✨ New Features\n\n`;
      features.forEach(item => markdown += `${item}\n`);
      markdown += '\n';
    }
    
    // Bug fixes
    if (fixes.length > 0) {
      markdown += `## 🐛 Bug Fixes\n\n`;
      fixes.forEach(item => markdown += `${item}\n`);
      markdown += '\n';
    }
    
    // Other changes
    if (other.length > 0) {
      markdown += `## 📝 Other Changes\n\n`;
      other.forEach(item => markdown += `${item}\n`);
      markdown += '\n';
    }
    
    // Footer
    markdown += `---\n\n`;
    markdown += `*Generated on ${new Date().toISOString().split('T')[0]}*\n`;
    
    return markdown;
  }

  public async generateReleaseNotes(): Promise<void> {
    console.log('🚀 Generating release notes...\n');
    
    // Get version
    const version = this.packageJson.version || '1.0.0';
    console.log(`📦 Version: ${version}`);
    
    // Get last tag
    const lastTag = this.getLastTag();
    console.log(`🏷️  Last tag: ${lastTag || 'None (first release)'}`);
    
    // Get commits since last tag
    const commits = this.getCommitsSinceTag(lastTag);
    console.log(`📝 Found ${commits.length} commits since last tag`);
    
    if (commits.length === 0) {
      console.log('⚠️  No new commits found. Nothing to generate.');
      return;
    }
    
    // Categorize commits
    const { features, fixes, breaking, other } = this.categorizeCommits(commits);
    
    // Get payment status
    const paymentStatus = this.getPaymentStatus();
    console.log(`💳 Payment status: ${paymentStatus}`);
    
    // Create release notes object
    const releaseNotes: ReleaseNotes = {
      version,
      date: new Date().toISOString().split('T')[0],
      commits,
      features,
      fixes,
      breaking,
      other,
      paymentStatus
    };
    
    // Generate markdown
    const markdown = this.generateMarkdown(releaseNotes);
    
    // Write to file
    const outputPath = join(this.repoPath, 'RELEASE_NOTES.md');
    writeFileSync(outputPath, markdown);
    
    console.log(`\n✅ Release notes generated successfully!`);
    console.log(`📄 Output: ${outputPath}`);
    console.log(`\n📊 Summary:`);
    console.log(`   - Features: ${features.length}`);
    console.log(`   - Fixes: ${fixes.length}`);
    console.log(`   - Breaking changes: ${breaking.length}`);
    console.log(`   - Other changes: ${other.length}`);
    
    // Show preview
    console.log(`\n📖 Preview:\n`);
    console.log(markdown.split('\n').slice(0, 20).join('\n'));
    if (markdown.split('\n').length > 20) {
      console.log('...\n');
    }
  }
}

// CLI execution
if (require.main === module) {
  const generator = new ReleaseNotesGenerator();
  generator.generateReleaseNotes().catch(error => {
    console.error('❌ Error generating release notes:', error);
    process.exit(1);
  });
}

module.exports = ReleaseNotesGenerator;
