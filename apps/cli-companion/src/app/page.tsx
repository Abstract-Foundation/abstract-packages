'use client';

import { useCallback, useState } from 'react';

import styles from './home.module.scss';

type Client = 'claude-code' | 'claude-desktop' | 'cursor';

const COMMANDS = {
  init: 'npx -y @abstract-foundation/agw-mcp init --chain-id 2741',
  'claude-code':
    'claude mcp add agw -- npx -y @abstract-foundation/agw-mcp serve --chain-id 2741',
  json: `{
  "mcpServers": {
    "agw-mcp": {
      "command": "npx",
      "args": ["-y", "@abstract-foundation/agw-mcp", "serve", "--chain-id", "2741"]
    }
  }
}`,
} as const;

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [text]);

  return (
    <button
      className={`${styles.copyButton} ${copied ? styles.copyButtonCopied : ''}`}
      onClick={handleCopy}
      type="button"
      aria-label="Copy to clipboard"
    >
      <svg
        className={styles.copyIcon}
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="none"
        style={{ opacity: copied ? 0 : 1 }}
      >
        <rect
          x="5.5"
          y="5.5"
          width="8"
          height="8"
          rx="1.5"
          stroke="currentColor"
          strokeWidth="1.2"
        />
        <path
          d="M10.5 5.5V3.5a1.5 1.5 0 00-1.5-1.5h-5A1.5 1.5 0 002.5 3.5v5a1.5 1.5 0 001.5 1.5h2"
          stroke="currentColor"
          strokeWidth="1.2"
        />
      </svg>
      <svg
        className={styles.checkIcon}
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="none"
        style={{ opacity: copied ? 1 : 0 }}
      >
        <path
          d="M3.5 8.5L6.5 11.5L12.5 5.5"
          stroke="#19e783"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}

export default function HomePage() {
  const [activeClient, setActiveClient] = useState<Client>('claude-code');

  return (
    <div className={styles.page}>
      <div className={styles.hero}>
        <div className={styles.tag}>
          <span className={styles.tagDot} />
          MCP Server
        </div>
        <h1 className={styles.title}>Abstract Global Wallet for AI Agents</h1>
        <p className={styles.subtitle}>
          Give your AI tools secure, scoped access to your Abstract wallet.
          Set up in a few minutes — no coding required.
        </p>
      </div>

      <div className={styles.guide}>
        <section className={styles.section}>
          {/* Step 1 */}
          <div className={styles.sectionHeader}>
            <div className={styles.stepNumber}>1</div>
            <h2 className={styles.sectionTitle}>Create a session</h2>
          </div>
          <div className={styles.sectionBody}>
            <p className={styles.text}>
              Open your terminal and run this command. It will open a browser window
              where you connect your wallet and choose what your agent is allowed to do.
            </p>
            <div className={styles.codeBlock}>
              <CopyButton text={COMMANDS.init} />
              <code className={styles.code}>
                <span className={styles.codeCmd}>npx</span>{' '}
                <span className={styles.codeFlag}>-y</span>{' '}
                <span className={styles.codeString}>@abstract-foundation/agw-mcp</span>{' '}
                <span className={styles.codeFlag}>init</span>{' '}
                <span className={styles.codePunct}>--</span>
                <span className={styles.codeFlag}>chain-id</span>{' '}
                <span className={styles.codeString}>2741</span>
              </code>
            </div>
          </div>

          {/* Step 2 */}
          <div className={styles.sectionHeader}>
            <div className={styles.stepNumber}>2</div>
            <h2 className={styles.sectionTitle}>Add to your MCP client</h2>
          </div>
          <div className={styles.sectionBody}>
            <p className={styles.text}>
              Tell your AI client how to find the AGW server. Pick your client below:
            </p>

            <div className={styles.clientTabs}>
              <button
                type="button"
                className={activeClient === 'claude-code' ? styles.clientTabActive : styles.clientTab}
                onClick={() => setActiveClient('claude-code')}
              >
                Claude Code
              </button>
              <button
                type="button"
                className={activeClient === 'claude-desktop' ? styles.clientTabActive : styles.clientTab}
                onClick={() => setActiveClient('claude-desktop')}
              >
                Claude Desktop
              </button>
              <button
                type="button"
                className={activeClient === 'cursor' ? styles.clientTabActive : styles.clientTab}
                onClick={() => setActiveClient('cursor')}
              >
                Cursor / Windsurf
              </button>
            </div>

            {activeClient === 'claude-code' && (
              <>
                <p className={styles.text}>
                  Run this in your terminal:
                </p>
                <div className={styles.codeBlock}>
                  <CopyButton text={COMMANDS['claude-code']} />
                  <code className={styles.code}>
                    <span className={styles.codeCmd}>claude</span>{' '}
                    <span className={styles.codeFlag}>mcp add</span>{' '}
                    <span className={styles.codeString}>agw</span>{' '}
                    <span className={styles.codePunct}>--</span>{' '}
                    <span className={styles.codeCmd}>npx</span>{' '}
                    <span className={styles.codeFlag}>-y</span>{' '}
                    <span className={styles.codeString}>@abstract-foundation/agw-mcp</span>{' '}
                    <span className={styles.codeFlag}>serve</span>{' '}
                    <span className={styles.codePunct}>--</span>
                    <span className={styles.codeFlag}>chain-id</span>{' '}
                    <span className={styles.codeString}>2741</span>
                  </code>
                </div>
              </>
            )}

            {activeClient === 'claude-desktop' && (
              <>
                <p className={styles.text}>
                  Open the Claude Desktop config file at:
                </p>
                <p className={styles.text}>
                  <strong>macOS:</strong>{' '}
                  <span className={styles.configPath}>~/Library/Application Support/Claude/claude_desktop_config.json</span>
                </p>
                <p className={styles.text}>
                  <strong>Windows:</strong>{' '}
                  <span className={styles.configPath}>%APPDATA%\Claude\claude_desktop_config.json</span>
                </p>
                <p className={styles.text}>
                  Add this to the file (or create it if it doesn&#39;t exist):
                </p>
                <div className={styles.codeBlock}>
                  <CopyButton text={COMMANDS.json} />
                  <code className={styles.code}>
                    <span className={styles.codePunct}>{'{'}</span>{'\n'}
                    {'  '}<span className={styles.codeKey}>&quot;mcpServers&quot;</span>
                    <span className={styles.codePunct}>: {'{'}</span>{'\n'}
                    {'    '}<span className={styles.codeKey}>&quot;agw-mcp&quot;</span>
                    <span className={styles.codePunct}>: {'{'}</span>{'\n'}
                    {'      '}<span className={styles.codeKey}>&quot;command&quot;</span>
                    <span className={styles.codePunct}>: </span>
                    <span className={styles.codeString}>&quot;npx&quot;</span>
                    <span className={styles.codePunct}>,</span>{'\n'}
                    {'      '}<span className={styles.codeKey}>&quot;args&quot;</span>
                    <span className={styles.codePunct}>: [</span>{'\n'}
                    {'        '}<span className={styles.codeString}>&quot;-y&quot;</span>
                    <span className={styles.codePunct}>,</span>{'\n'}
                    {'        '}<span className={styles.codeString}>&quot;@abstract-foundation/agw-mcp&quot;</span>
                    <span className={styles.codePunct}>,</span>{'\n'}
                    {'        '}<span className={styles.codeString}>&quot;serve&quot;</span>
                    <span className={styles.codePunct}>,</span>{'\n'}
                    {'        '}<span className={styles.codeString}>&quot;--chain-id&quot;</span>
                    <span className={styles.codePunct}>,</span>{'\n'}
                    {'        '}<span className={styles.codeString}>&quot;2741&quot;</span>{'\n'}
                    {'      '}<span className={styles.codePunct}>]</span>{'\n'}
                    {'    '}<span className={styles.codePunct}>{'}'}</span>{'\n'}
                    {'  '}<span className={styles.codePunct}>{'}'}</span>{'\n'}
                    <span className={styles.codePunct}>{'}'}</span>
                  </code>
                </div>
                <p className={styles.text}>
                  Save the file, then restart Claude Desktop.
                </p>
              </>
            )}

            {activeClient === 'cursor' && (
              <>
                <p className={styles.text}>
                  Open your editor&#39;s MCP configuration file and add the same JSON block:
                </p>
                <div className={styles.codeBlock}>
                  <CopyButton text={COMMANDS.json} />
                  <code className={styles.code}>
                    <span className={styles.codePunct}>{'{'}</span>{'\n'}
                    {'  '}<span className={styles.codeKey}>&quot;mcpServers&quot;</span>
                    <span className={styles.codePunct}>: {'{'}</span>{'\n'}
                    {'    '}<span className={styles.codeKey}>&quot;agw-mcp&quot;</span>
                    <span className={styles.codePunct}>: {'{'}</span>{'\n'}
                    {'      '}<span className={styles.codeKey}>&quot;command&quot;</span>
                    <span className={styles.codePunct}>: </span>
                    <span className={styles.codeString}>&quot;npx&quot;</span>
                    <span className={styles.codePunct}>,</span>{'\n'}
                    {'      '}<span className={styles.codeKey}>&quot;args&quot;</span>
                    <span className={styles.codePunct}>: [</span>{'\n'}
                    {'        '}<span className={styles.codeString}>&quot;-y&quot;</span>
                    <span className={styles.codePunct}>,</span>{'\n'}
                    {'        '}<span className={styles.codeString}>&quot;@abstract-foundation/agw-mcp&quot;</span>
                    <span className={styles.codePunct}>,</span>{'\n'}
                    {'        '}<span className={styles.codeString}>&quot;serve&quot;</span>
                    <span className={styles.codePunct}>,</span>{'\n'}
                    {'        '}<span className={styles.codeString}>&quot;--chain-id&quot;</span>
                    <span className={styles.codePunct}>,</span>{'\n'}
                    {'        '}<span className={styles.codeString}>&quot;2741&quot;</span>{'\n'}
                    {'      '}<span className={styles.codePunct}>]</span>{'\n'}
                    {'    '}<span className={styles.codePunct}>{'}'}</span>{'\n'}
                    {'  '}<span className={styles.codePunct}>{'}'}</span>{'\n'}
                    <span className={styles.codePunct}>{'}'}</span>
                  </code>
                </div>
                <p className={styles.text}>
                  Save and restart your editor. The AGW tools will be available in your next AI session.
                </p>
              </>
            )}
          </div>

          {/* Step 3 */}
          <div className={styles.sectionHeader}>
            <div className={styles.stepNumber}>3</div>
            <h2 className={styles.sectionTitle}>Start using it</h2>
          </div>
          <div className={styles.sectionBody}>
            <p className={styles.text}>
              Open your AI client and try asking it something like:
            </p>
            <div className={styles.codeBlock}>
              <code className={styles.code}>
                <span className={styles.codeComment}># Check your wallet</span>{'\n'}
                <span className={styles.codeString}>&quot;What&#39;s my wallet address and balance?&quot;</span>{'\n'}
                {'\n'}
                <span className={styles.codeComment}># Send a token</span>{'\n'}
                <span className={styles.codeString}>&quot;Send 0.01 ETH to 0x1234...&quot;</span>{'\n'}
                {'\n'}
                <span className={styles.codeComment}># Check session status</span>{'\n'}
                <span className={styles.codeString}>&quot;Is my wallet session still active?&quot;</span>
              </code>
            </div>
          </div>
        </section>

        <div className={styles.footer}>
          <p className={styles.footerText}>
            Full documentation and source code on{' '}
            <a
              href="https://github.com/Abstract-Foundation/agw-mcp"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.footerLink}
            >
              GitHub
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
