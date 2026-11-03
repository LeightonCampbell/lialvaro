module.exports = {
  ci: {
    collect: {
      startServerCommand: 'npm run dev -- --port 4324',
      url: ['http://localhost:4324/', 'http://localhost:4324/shop/', 'http://localhost:4324/faq/', 'http://localhost:4324/design/'],
      numberOfRuns: 1,
      settings: { chromeFlags: '--no-sandbox' },
    },
    assert: {
      assertions: {
        'categories:performance': ['warn', { minScore: 0.45 }],
        'categories:accessibility': ['error', { minScore: 0.9 }],
        'categories:best-practices': ['warn', { minScore: 0.8 }],
        'categories:seo': ['warn', { minScore: 0.8 }],
      },
    },
    upload: {
      target: 'filesystem',
      outputDir: '.lighthouseci',
    },
  },
};
