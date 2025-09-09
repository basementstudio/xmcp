import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import { describe, test, expect, beforeAll, afterAll } from 'vitest';
import { createProject } from '../src/helpers/create.js';

// Get __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('Components Selection', () => {
  const testProjectPath = path.join(__dirname, 'tmp-test-project');
  
  afterAll(() => {
    fs.removeSync(testProjectPath);
  });

  test('should initialize both tools and prompts by default', () => {
    // Create project with default options
    createProject({
      projectPath: testProjectPath,
      projectName: 'test-project',
      packageManager: 'npm',
      transports: ['http'],
      packageVersion: '0.0.0',
      skipInstall: true,
    });

    // Check that tools and prompts directories were created
    expect(fs.existsSync(path.join(testProjectPath, 'src/tools'))).toBe(true);
    expect(fs.existsSync(path.join(testProjectPath, 'src/prompts'))).toBe(true);

    // Check that config has both paths
    const configPath = path.join(testProjectPath, 'xmcp.config.ts');
    const configContent = fs.readFileSync(configPath, 'utf8');
    expect(configContent).toContain('tools: "src/tools"');
    expect(configContent).toContain('prompts: "src/prompts"');

    // Clean up for next test
    fs.removeSync(testProjectPath);
  });

  test('should not initialize tools when specified', () => {
    // Create project with tools disabled
    createProject({
      projectPath: testProjectPath,
      projectName: 'test-project',
      packageManager: 'npm',
      transports: ['http'],
      packageVersion: '0.0.0',
      skipInstall: true,
      initTools: false,
      initPrompts: true,
    });

    // Check that tools directory is not created but prompts is
    expect(fs.existsSync(path.join(testProjectPath, 'src/tools'))).toBe(false);
    expect(fs.existsSync(path.join(testProjectPath, 'src/prompts'))).toBe(true);

    // Check that config has only prompts path
    const configPath = path.join(testProjectPath, 'xmcp.config.ts');
    const configContent = fs.readFileSync(configPath, 'utf8');
    expect(configContent).not.toContain('tools: "src/tools"');
    expect(configContent).toContain('prompts: "src/prompts"');

    // Clean up for next test
    fs.removeSync(testProjectPath);
  });

  test('should not initialize prompts when specified', () => {
    // Create project with prompts disabled
    createProject({
      projectPath: testProjectPath,
      projectName: 'test-project',
      packageManager: 'npm',
      transports: ['http'],
      packageVersion: '0.0.0',
      skipInstall: true,
      initTools: true,
      initPrompts: false,
    });

    // Check that prompts directory is not created but tools is
    expect(fs.existsSync(path.join(testProjectPath, 'src/tools'))).toBe(true);
    expect(fs.existsSync(path.join(testProjectPath, 'src/prompts'))).toBe(false);

    // Check that config has only tools path
    const configPath = path.join(testProjectPath, 'xmcp.config.ts');
    const configContent = fs.readFileSync(configPath, 'utf8');
    expect(configContent).toContain('tools: "src/tools"');
    expect(configContent).not.toContain('prompts: "src/prompts"');

    // Clean up for next test
    fs.removeSync(testProjectPath);
  });

  test('should not initialize tools or prompts when both are disabled', () => {
    // Create project with both tools and prompts disabled
    createProject({
      projectPath: testProjectPath,
      projectName: 'test-project',
      packageManager: 'npm',
      transports: ['http'],
      packageVersion: '0.0.0',
      skipInstall: true,
      initTools: false,
      initPrompts: false,
    });

    // Check that neither tools nor prompts directories are created
    expect(fs.existsSync(path.join(testProjectPath, 'src/tools'))).toBe(false);
    expect(fs.existsSync(path.join(testProjectPath, 'src/prompts'))).toBe(false);

    // Check that config has neither path
    const configPath = path.join(testProjectPath, 'xmcp.config.ts');
    const configContent = fs.readFileSync(configPath, 'utf8');
    expect(configContent).not.toContain('tools: "src/tools"');
    expect(configContent).not.toContain('prompts: "src/prompts"');
    
    // Check if paths section exists at all in the config
    expect(configContent).not.toContain('paths:');
  });
});
