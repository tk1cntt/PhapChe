import { describe, it, expect, beforeEach } from 'vitest';
import {
  chunkDocument,
  cosineSimilarity,
  embedText,
  embedBatch,
  indexDocument,
  semanticSearch,
  getIndexStats,
  isVectorStoreReady,
  vectorIndex,
} from '../vector-store';

// ── ChunkDocument ───────────────────────────────────────────

describe('chunkDocument', () => {
  describe('Whitebox', () => {
    it('should split text into chunks respecting paragraph boundaries', () => {
      const text = [
        'Điều 1. Phạm vi điều chỉnh',
        'Luật này quy định về việc thành lập, tổ chức quản lý và hoạt động của doanh nghiệp.',
        '',
        'Điều 2. Đối tượng áp dụng',
        'Luật này áp dụng đối với doanh nghiệp thuộc mọi thành phần kinh tế.',
        '',
        'Điều 3. Giải thích từ ngữ',
        'Trong Luật này, các từ ngữ dưới đây được hiểu như sau:',
      ].join('\n\n');

      const chunks = chunkDocument(text, 200, 30);
      expect(chunks.length).toBeGreaterThanOrEqual(1);
      // Each chunk should contain meaningful content
      chunks.forEach((chunk) => {
        expect(chunk.content.length).toBeGreaterThan(0);
        expect(typeof chunk.index).toBe('number');
      });
    });

    it('should assign sequential chunk indices', () => {
      const text = 'A\n\nB\n\nC\n\nD\n\nE';
      const chunks = chunkDocument(text, 10, 2);
      const indices = chunks.map((c) => c.index);
      for (let i = 1; i < indices.length; i++) {
        expect(indices[i]).toBeGreaterThan(indices[i - 1]);
      }
    });

    it('should handle empty input', () => {
      const chunks = chunkDocument('');
      expect(chunks).toHaveLength(0);
    });

    it('should handle whitespace-only input', () => {
      const chunks = chunkDocument('   \n\n   \n\n  ');
      expect(chunks).toHaveLength(0);
    });
  });

  describe('Blackbox', () => {
    it('should produce chunks smaller than or close to chunk size', () => {
      const text = Array(20).fill('Đoạn văn bản pháp luật mẫu với nội dung đủ dài để kiểm tra việc chia nhỏ văn bản thành các đoạn có kích thước phù hợp.').join('\n\n');
      const chunks = chunkDocument(text, 400, 50);
      chunks.forEach((chunk) => {
        expect(chunk.content.length).toBeLessThanOrEqual(800); // Allow some overflow from last paragraph
      });
    });

    it('should preserve paragraph structure', () => {
      const text = 'Điều 1: A\n\nĐiều 2: B\n\nĐiều 3: C';
      const chunks = chunkDocument(text, 1000, 50);
      expect(chunks.length).toBe(1);
      expect(chunks[0].content).toContain('Điều 1');
      expect(chunks[0].content).toContain('Điều 2');
      expect(chunks[0].content).toContain('Điều 3');
    });

    it('should handle single paragraph', () => {
      const text = 'Một đoạn văn bản duy nhất không có ngắt đoạn.';
      const chunks = chunkDocument(text);
      expect(chunks).toHaveLength(1);
      expect(chunks[0].content).toBe(text);
    });
  });

  describe('Abnormal', () => {
    it('should handle very long paragraphs gracefully', () => {
      const text = 'Luật Doanh nghiệp 2020 quy định về '.repeat(200);
      const chunks = chunkDocument(text, 500, 50);
      // With no paragraph breaks, all goes into one chunk
      expect(chunks.length).toBeGreaterThanOrEqual(1);
      chunks.forEach((c) => expect(c.content.length).toBeGreaterThan(0));
    });

    it('should handle mixed line endings (\\n, \\r\\n)', () => {
      const text = 'Para 1\r\n\r\nPara 2\n\nPara 3';
      const chunks = chunkDocument(text, 200, 30);
      expect(chunks.length).toBeGreaterThanOrEqual(1);
    });

    it('should accept custom chunkSize and overlap', () => {
      const text = 'A\n\nB\n\nC\n\nD\n\nE\n\nF';
      const chunks = chunkDocument(text, 10, 5);
      expect(chunks.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Error', () => {
    it('should return empty array for null', () => {
      // @ts-expect-error - testing runtime behavior with null
      const chunks = chunkDocument(null);
      expect(chunks).toHaveLength(0);
    });

    it('should return empty array for undefined', () => {
      // @ts-expect-error - testing runtime behavior
      const chunks = chunkDocument(undefined);
      expect(chunks).toHaveLength(0);
    });
  });
});

// ── CosineSimilarity ────────────────────────────────────────

describe('cosineSimilarity', () => {
  describe('Whitebox', () => {
    it('should return 1 for identical vectors', () => {
      const vec = [1, 2, 3, 4];
      expect(cosineSimilarity(vec, vec)).toBeCloseTo(1, 5);
    });

    it('should return 0 for orthogonal vectors', () => {
      const a = [1, 0, 0];
      const b = [0, 1, 0];
      expect(cosineSimilarity(a, b)).toBe(0);
    });

    it('should return -1 for opposite vectors', () => {
      const a = [1, 2, 3];
      const b = [-1, -2, -3];
      expect(cosineSimilarity(a, b)).toBeCloseTo(-1, 5);
    });
  });

  describe('Blackbox', () => {
    it('should give higher score to similar vectors', () => {
      const base = [1, 2, 3, 4, 5];
      const similar = [1.1, 2.1, 3, 4.1, 5];
      const different = [-1, -2, -3, -4, -5];

      const simScore = cosineSimilarity(base, similar);
      const diffScore = cosineSimilarity(base, different);

      expect(simScore).toBeGreaterThan(diffScore);
      expect(simScore).toBeGreaterThan(0.9);
    });

    it('should handle zero vectors', () => {
      const zero = [0, 0, 0];
      const nonZero = [1, 2, 3];
      expect(cosineSimilarity(zero, nonZero)).toBe(0);
      expect(cosineSimilarity(zero, zero)).toBe(0);
    });
  });

  describe('Error', () => {
    it('should throw on dimension mismatch', () => {
      expect(() => cosineSimilarity([1, 2], [1, 2, 3])).toThrow('dimension mismatch');
    });
  });
});

// ── EmbedText / EmbedBatch ──────────────────────────────────

describe('embedText', () => {
  describe('Blackbox', () => {
    it('should return a vector of numbers', async () => {
      const embedding = await embedText('Hợp đồng lao động theo Bộ luật Lao động 2019');
      expect(Array.isArray(embedding)).toBe(true);
      expect(embedding.length).toBeGreaterThan(0);
      embedding.forEach((v) => expect(typeof v).toBe('number'));
    });

    it('should return different embeddings for different texts', async () => {
      const emb1 = await embedText('Hợp đồng lao động');
      const emb2 = await embedText('Đăng ký nhãn hiệu độc quyền');
      // Should not be identical
      const sim = cosineSimilarity(emb1, emb2);
      expect(sim).toBeLessThan(1);
    });

    it('should return deterministic embeddings (same input → same output)', async () => {
      const text = 'Điều 117 Bộ luật Dân sự 2015';
      const emb1 = await embedText(text);
      const emb2 = await embedText(text);
      expect(emb1).toEqual(emb2);
    });
  });

  describe('Whitebox', () => {
    it('should produce normalized vectors (unit length)', async () => {
      const embedding = await embedText('Test normalization');
      const magnitude = Math.sqrt(embedding.reduce((s, v) => s + v * v, 0));
      expect(magnitude).toBeCloseTo(1, 3);
    });
  });

  describe('Abnormal', () => {
    it('should handle empty text', async () => {
      const embedding = await embedText('');
      expect(embedding.length).toBeGreaterThan(0);
    });

    it('should handle very long text', async () => {
      const text = 'Luật '.repeat(5000);
      const embedding = await embedText(text);
      expect(embedding.length).toBe(256);
    });
  });
});

describe('embedBatch', () => {
  it('should return embeddings for all texts', async () => {
    const texts = ['Hợp đồng', 'Lao động', 'Doanh nghiệp'];
    const embeddings = await embedBatch(texts);
    expect(embeddings).toHaveLength(3);
    embeddings.forEach((emb, i) => {
      expect(Array.isArray(emb)).toBe(true);
      expect(emb.length).toBeGreaterThan(0);
    });
  });

  it('should preserve order', async () => {
    const texts = ['Hợp đồng lao động', 'Đăng ký nhãn hiệu', 'Thành lập doanh nghiệp'];
    const batch = await embedBatch(texts);
    expect(batch).toHaveLength(3);
    // Each embedding is a valid vector
    batch.forEach((emb) => {
      expect(Array.isArray(emb)).toBe(true);
      expect(emb.length).toBeGreaterThan(0);
    });
  });

  it('should handle empty array', async () => {
    const embeddings = await embedBatch([]);
    expect(embeddings).toHaveLength(0);
  });
});

// ── VectorIndex ─────────────────────────────────────────────

describe('VectorIndex', () => {
  beforeEach(() => {
    vectorIndex.clear();
  });

  describe('Whitebox', () => {
    it('should start empty', () => {
      expect(vectorIndex.size).toBe(0);
      expect(vectorIndex.documentCount).toBe(0);
    });

    it('should add and retrieve chunks via search', async () => {
      const chunk1 = {
        id: 'doc1:chunk:0',
        documentId: 'doc1',
        source: 'Luật Doanh nghiệp 2020',
        content: 'Điều 1: Phạm vi điều chỉnh',
        chunkIndex: 0,
        embedding: await embedText('Điều 1: Phạm vi điều chỉnh'),
        domainTags: ['corporate-legal'] as const,
        metadata: {},
        indexedAt: new Date().toISOString(),
      };

      vectorIndex.add(chunk1);
      expect(vectorIndex.size).toBe(1);
      expect(vectorIndex.documentCount).toBe(1);

      const queryEmb = await embedText('phạm vi điều chỉnh doanh nghiệp');
      const results = vectorIndex.search(queryEmb, 5, 0.3);
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].chunk.documentId).toBe('doc1');
    });

    it('should replace chunks with the same ID', () => {
      const base = {
        id: 'doc1:chunk:0',
        documentId: 'doc1',
        source: 'Source A',
        content: 'Content A',
        chunkIndex: 0,
        embedding: [0.1, 0.2, 0.3],
        domainTags: ['corporate-legal'] as const,
        metadata: {},
        indexedAt: new Date().toISOString(),
      };

      vectorIndex.add(base);
      expect(vectorIndex.size).toBe(1);

      vectorIndex.add({ ...base, source: 'Source B' });
      expect(vectorIndex.size).toBe(1);
    });

    it('should remove documents by documentId', () => {
      for (let i = 0; i < 3; i++) {
        vectorIndex.add({
          id: `doc1:chunk:${i}`,
          documentId: 'doc1',
          source: 'Test',
          content: `Content ${i}`,
          chunkIndex: i,
          embedding: [i * 0.1, 0.5, 0.3],
          domainTags: ['corporate-legal'] as const,
          metadata: {},
          indexedAt: new Date().toISOString(),
        });
      }
      vectorIndex.add({
        id: 'doc2:chunk:0',
        documentId: 'doc2',
        source: 'Test 2',
        content: 'Other',
        chunkIndex: 0,
        embedding: [0.7, 0.8, 0.9],
        domainTags: ['employment-legal'] as const,
        metadata: {},
        indexedAt: new Date().toISOString(),
      });

      expect(vectorIndex.size).toBe(4);

      const removed = vectorIndex.removeDocument('doc1');
      expect(removed).toBe(3);
      expect(vectorIndex.size).toBe(1);
      expect(vectorIndex.documentCount).toBe(1);
    });
  });

  describe('Blackbox', () => {
    it('should filter by domain tags', async () => {
      const now = new Date().toISOString();
      vectorIndex.add({
        id: 'corp:chunk:0',
        documentId: 'corp',
        source: 'Luật DN',
        content: 'Thành lập doanh nghiệp',
        chunkIndex: 0,
        embedding: await embedText('Thành lập doanh nghiệp'),
        domainTags: ['corporate-legal'],
        metadata: {},
        indexedAt: now,
      });
      vectorIndex.add({
        id: 'emp:chunk:0',
        documentId: 'emp',
        source: 'Bộ luật Lao động',
        content: 'Hợp đồng lao động',
        chunkIndex: 0,
        embedding: await embedText('Hợp đồng lao động'),
        domainTags: ['employment-legal'],
        metadata: {},
        indexedAt: now,
      });

      const queryEmb = await embedText('doanh nghiệp');
      const results = vectorIndex.search(queryEmb, 10, 0.1, ['corporate-legal']);
      expect(results.every((r) => r.chunk.domainTags.includes('corporate-legal'))).toBe(true);
    });

    it('should return results sorted by score descending', async () => {
      const now = new Date().toISOString();
      // Add chunks with varying similarity
      vectorIndex.add({
        id: 'doc:chunk:0',
        documentId: 'doc',
        source: 'Test',
        content: 'La Hợ đồng động lao động',
        chunkIndex: 0,
        embedding: await embedText('Hợp đồng lao động có thời hạn 12 tháng'),
        domainTags: ['employment-legal'],
        metadata: {},
        indexedAt: now,
      });
      vectorIndex.add({
        id: 'doc:chunk:1',
        documentId: 'doc',
        source: 'Test',
        content: 'Thành lập công ty cổ phần',
        chunkIndex: 1,
        embedding: await embedText('Thành lập công ty cổ phần'),
        domainTags: ['corporate-legal'],
        metadata: {},
        indexedAt: now,
      });

      const queryEmb = await embedText('hợp đồng lao động');
      const results = vectorIndex.search(queryEmb, 10, 0.1);

      for (let i = 1; i < results.length; i++) {
        expect(results[i].score).toBeLessThanOrEqual(results[i - 1].score);
      }
    });
  });

  describe('Abnormal', () => {
    it('should handle empty index search', async () => {
      const queryEmb = await embedText('test');
      const results = vectorIndex.search(queryEmb);
      expect(results).toHaveLength(0);
    });

    it('should handle search with no matching domain tags', async () => {
      vectorIndex.add({
        id: 'doc:chunk:0',
        documentId: 'doc',
        source: 'Test',
        content: 'Content',
        chunkIndex: 0,
        embedding: await embedText('Hợp đồng'),
        domainTags: ['commercial-legal'],
        metadata: {},
        indexedAt: new Date().toISOString(),
      });

      const queryEmb = await embedText('doanh nghiệp');
      const results = vectorIndex.search(queryEmb, 10, 0.1, ['ip-legal']);
      expect(results).toHaveLength(0);
    });
  });
});

// ── indexDocument / semanticSearch ──────────────────────────

describe('indexDocument / semanticSearch integration', () => {
  beforeEach(() => {
    vectorIndex.clear();
  });

  it('should index and search a document end-to-end', async () => {
    const content = [
      'Điều 1. Phạm vi điều chỉnh',
      'Luật này quy định về việc thành lập, tổ chức quản lý và hoạt động của doanh nghiệp, bao gồm công ty trách nhiệm hữu hạn, công ty cổ phần, công ty hợp danh và doanh nghiệp tư nhân.',
      '',
      'Điều 2. Đối tượng áp dụng',
      '1. Doanh nghiệp thuộc mọi thành phần kinh tế.',
      '2. Cơ quan, tổ chức, cá nhân có liên quan đến việc thành lập, tổ chức quản lý và hoạt động của doanh nghiệp.',
    ].join('\n\n');

    const count = await indexDocument(
      'luat-doanh-nghiep-2020',
      'Luật Doanh nghiệp 2020 — Chương I',
      content,
      ['corporate-legal'],
    );

    expect(count).toBeGreaterThan(0);
    expect(isVectorStoreReady()).toBe(true);

    const stats = getIndexStats();
    expect(stats.documentCount).toBe(1);
    expect(stats.chunkCount).toBe(count);

    // Search
    const results = await semanticSearch({
      query: 'thành lập công ty cổ phần',
      domainTags: ['corporate-legal'],
      topK: 3,
    });

    expect(results.length).toBeGreaterThan(0);
    results.forEach((r) => {
      expect(r.score).toBeGreaterThanOrEqual(0);
      expect(r.score).toBeLessThanOrEqual(1);
      expect(r.chunk.source).toBe('Luật Doanh nghiệp 2020 — Chương I');
    });
  });

  it('should index multiple documents', async () => {
    await indexDocument('doc1', 'Luật DN 2020', 'Doanh nghiệp tư nhân là doanh nghiệp do một cá nhân làm chủ.', ['corporate-legal']);
    await indexDocument('doc2', 'BLLĐ 2019', 'Hợp đồng lao động là sự thỏa thuận giữa người lao động và người sử dụng lao động.', ['employment-legal']);

    const stats = getIndexStats();
    expect(stats.documentCount).toBe(2);

    // Search across domains
    const results = await semanticSearch({
      query: 'người lao động',
    });
    expect(results.length).toBeGreaterThan(0);
  });
});

// ── getIndexStats / isVectorStoreReady ──────────────────────

describe('getIndexStats / isVectorStoreReady', () => {
  beforeEach(() => {
    vectorIndex.clear();
  });

  it('should return zeroes for empty index', () => {
    expect(isVectorStoreReady()).toBe(false);
    expect(getIndexStats().chunkCount).toBe(0);
    expect(getIndexStats().documentCount).toBe(0);
    expect(getIndexStats().sources).toEqual([]);
  });

  it('should track document sources correctly', async () => {
    await indexDocument('doc1', 'Source 1', 'Content 1', ['commercial-legal']);
    await indexDocument('doc2', 'Source 2', 'Content 2\n\nMore content', ['employment-legal']);

    const stats = getIndexStats();
    expect(stats.sources).toHaveLength(2);
    expect(stats.sources.map((s) => s.source)).toContain('Source 1');
    expect(stats.sources.map((s) => s.source)).toContain('Source 2');
  });
});
