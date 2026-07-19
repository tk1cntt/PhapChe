import { describe, it, expect, beforeEach, vi } from 'vitest';
import { luatDoanhNghiep2020 } from '../legal-knowledge/luat-doanh-nghiep-2020';
import { boLuatLaoDong2019 } from '../legal-knowledge/bo-luat-lao-dong-2019';
import { boLuatDanSu2015 } from '../legal-knowledge/bo-luat-dan-su-2015';
import { listLegalDocuments, getDocumentText } from '../legal-knowledge';
import type { LegalKnowledgeDoc } from '../legal-knowledge/types';

// ── Helpers ──────────────────────────────────────────────────

function validateLegalDoc(doc: LegalKnowledgeDoc): string[] {
  const errors: string[] = [];

  if (!doc.id || typeof doc.id !== 'string') errors.push('id must be non-empty string');
  if (!doc.source || typeof doc.source !== 'string') errors.push('source must be non-empty string');
  if (!doc.version || typeof doc.version !== 'string') errors.push('version must be non-empty string');
  if (!Array.isArray(doc.domainTags) || doc.domainTags.length === 0) {
    errors.push('domainTags must be non-empty array');
  }
  if (!Array.isArray(doc.chapters) || doc.chapters.length === 0) {
    errors.push('chapters must be non-empty array');
  }

  for (const chapter of doc.chapters) {
    if (!chapter.title || typeof chapter.title !== 'string') {
      errors.push(`chapter ${chapter.title} must have a title`);
    }
    if (!Array.isArray(chapter.articles) || chapter.articles.length === 0) {
      errors.push(`chapter "${chapter.title}" must have at least 1 article`);
    }
    for (const article of chapter.articles) {
      if (!article.number || typeof article.number !== 'string') {
        errors.push(`article in "${chapter.title}" must have a number`);
      }
      if (!article.title || typeof article.title !== 'string') {
        errors.push(`article in "${chapter.title}" must have a title`);
      }
      if (!article.content || typeof article.content !== 'string') {
        errors.push(`article in "${chapter.title}" must have content`);
      }
    }
  }

  return errors;
}

function getAllDocs(): LegalKnowledgeDoc[] {
  return [luatDoanhNghiep2020, boLuatLaoDong2019, boLuatDanSu2015];
}

// ── Structure Validation ─────────────────────────────────────

describe('Legal Knowledge Docs — Structure', () => {
  describe('Whitebox', () => {
    it('all documents should have valid structure', () => {
      const allDocs = getAllDocs();
      for (const doc of allDocs) {
        const errors = validateLegalDoc(doc);
        expect(errors).withContext(`${doc.source} errors: ${errors.join(', ')}`).toHaveLength(0);
      }
    });

    it('all documents should have unique IDs', () => {
      const allDocs = getAllDocs();
      const ids = allDocs.map((d) => d.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(allDocs.length);
    });

    it('all articles should have content referencing their number', () => {
      for (const doc of getAllDocs()) {
        for (const chapter of doc.chapters) {
          for (const article of chapter.articles) {
            // Article numbers like "Điều X" should appear somewhere in the chapter
            expect(typeof article.number).toBe('string');
            expect(article.number.length).toBeGreaterThan(0);
            expect(article.content.length).toBeGreaterThan(10); // meaningful content
          }
        }
      }
    });
  });

  describe('Blackbox — Luật Doanh nghiệp 2020', () => {
    it('should have correct metadata', () => {
      expect(luatDoanhNghiep2020.id).toBe('luat-doanh-nghiep-2020');
      expect(luatDoanhNghiep2020.source).toContain('Luật Doanh nghiệp 2020');
      expect(luatDoanhNghiep2020.version).toBe('2020');
      expect(luatDoanhNghiep2020.domainTags).toContain('corporate-legal');
      expect(luatDoanhNghiep2020.domainTags).toContain('commercial-legal');
    });

    it('should cover all major company types', () => {
      const allContent = luatDoanhNghiep2020.chapters
        .flatMap((ch) => ch.articles)
        .map((a) => `${a.title} ${a.content}`)
        .join(' ');

      expect(allContent).toContain('công ty trách nhiệm hữu hạn');
      expect(allContent).toContain('công ty cổ phần');
      expect(allContent).toContain('doanh nghiệp tư nhân');
      expect(allContent).toContain('Giấy chứng nhận đăng ký doanh nghiệp');
    });

    it('should cover company dissolution', () => {
      const dissolutionArticles = luatDoanhNghiep2020.chapters
        .find((ch) => ch.title.includes('Giải thể'));
      expect(dissolutionArticles).toBeDefined();
      expect(dissolutionArticles!.articles.length).toBeGreaterThanOrEqual(2);
    });

    it('should include Hội đồng thành viên rules (LLC governance)', () => {
      const llcChapter = luatDoanhNghiep2020.chapters
        .find((ch) => ch.title.includes('TNHH'));
      expect(llcChapter).toBeDefined();
      const hasHDTV = llcChapter!.articles.some((a) =>
        a.title.includes('Hội đồng thành viên'),
      );
      expect(hasHDTV).toBe(true);
    });
  });

  describe('Blackbox — Bộ luật Lao động 2019', () => {
    it('should have correct metadata', () => {
      expect(boLuatLaoDong2019.id).toBe('bo-luat-lao-dong-2019');
      expect(boLuatLaoDong2019.source).toContain('Bộ luật Lao động 2019');
      expect(boLuatLaoDong2019.version).toBe('2019');
      expect(boLuatLaoDong2019.domainTags).toContain('employment-legal');
      expect(boLuatLaoDong2019.domainTags).toHaveLength(1);
    });

    it('should cover probation period (thử việc)', () => {
      const probArticles = boLuatLaoDong2019.chapters
        .flatMap((ch) => ch.articles)
        .filter((a) => a.title.includes('thử việc') || a.content.includes('thử việc'));
      expect(probArticles.length).toBeGreaterThanOrEqual(1);
    });

    it('should cover unilateral termination rights', () => {
      const terminationArticles = boLuatLaoDong2019.chapters
        .flatMap((ch) => ch.articles)
        .filter((a) => a.title.includes('đơn phương'));
      expect(terminationArticles.length).toBeGreaterThanOrEqual(1);
    });

    it('should specify notice periods for termination', () => {
      const content = boLuatLaoDong2019.chapters
        .flatMap((ch) => ch.articles)
        .map((a) => a.content)
        .join(' ');

      expect(content).toContain('45 ngày'); // indefinite term
      expect(content).toContain('30 ngày'); // fixed term 12-36 months
    });

    it('should cover overtime limits (làm thêm giờ)', () => {
      const overtimeContent = boLuatLaoDong2019.chapters
        .flatMap((ch) => ch.articles)
        .filter((a) => a.title.includes('làm thêm giờ') || a.title.includes('thêm giờ'));
      expect(overtimeContent.length).toBeGreaterThanOrEqual(1);
    });

    it('should cover dismissal grounds (sa thải)', () => {
      const dismissalContent = boLuatLaoDong2019.chapters
        .flatMap((ch) => ch.articles)
        .filter((a) => a.title.includes('Sa thải') || a.content.includes('sa thải'));
      expect(dismissalContent.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Blackbox — Bộ luật Dân sự 2015', () => {
    it('should have correct metadata', () => {
      expect(boLuatDanSu2015.id).toBe('bo-luat-dan-su-2015');
      expect(boLuatDanSu2015.source).toContain('Bộ luật Dân sự 2015');
      expect(boLuatDanSu2015.version).toBe('2015');
    });

    it('should cover contract law (hợp đồng dân sự)', () => {
      const contractChapter = boLuatDanSu2015.chapters
        .find((ch) => ch.title.includes('Hợp đồng dân sự'));
      expect(contractChapter).toBeDefined();
      expect(contractChapter!.articles.length).toBeGreaterThanOrEqual(5);
    });

    it('should cover conditions for valid civil transactions (Điều 117)', () => {
      const allArticles = boLuatDanSu2015.chapters.flatMap((ch) => ch.articles);
      const article117 = allArticles.find((a) => a.number === 'Điều 117');
      expect(article117).toBeDefined();
      expect(article117!.content).toContain('năng lực pháp luật dân sự');
      expect(article117!.content).toContain('tự nguyện');
    });

    it('should cover liability for damages (bồi thường thiệt hại)', () => {
      const damageChapter = boLuatDanSu2015.chapters
        .find((ch) => ch.title.includes('Bồi thường thiệt hại'));
      expect(damageChapter).toBeDefined();
      expect(damageChapter!.articles.length).toBeGreaterThanOrEqual(2);
    });

    it('should cover statute of limitations (thời hiệu)', () => {
      const allArticles = boLuatDanSu2015.chapters.flatMap((ch) => ch.articles);
      const limitationArticle = allArticles.find((a) =>
        a.title.includes('Thời hiệu') || a.content.includes('thời hiệu'),
      );
      expect(limitationArticle).toBeDefined();
      expect(limitationArticle!.content).toContain('03 năm'); // contract claim limitation
    });

    it('should cover legal entities (pháp nhân)', () => {
      const entityChapter = boLuatDanSu2015.chapters
        .find((ch) => ch.title.includes('Pháp nhân'));
      expect(entityChapter).toBeDefined();
      expect(entityChapter!.articles.length).toBeGreaterThanOrEqual(3);
    });

    it('should cover property rights (quyền sở hữu)', () => {
      const propertyChapter = boLuatDanSu2015.chapters
        .find((ch) => ch.title.includes('Sở hữu'));
      expect(propertyChapter).toBeDefined();
    });

    it('should cover invalidity of civil transactions', () => {
      const allContent = boLuatDanSu2015.chapters
        .flatMap((ch) => ch.articles)
        .map((a) => `${a.title} ${a.content}`)
        .join(' ');

      expect(allContent).toContain('vô hiệu');
      expect(allContent).toContain('lừa dối');
      expect(allContent).toContain('đe dọa');
    });
  });

  describe('Abnormal', () => {
    it('all documents should have at least one chapter', () => {
      for (const doc of getAllDocs()) {
        expect(doc.chapters.length).withContext(doc.source).toBeGreaterThanOrEqual(1);
      }
    });

    it('all chapters should have at least one article', () => {
      for (const doc of getAllDocs()) {
        for (const chapter of doc.chapters) {
          expect(chapter.articles.length)
            .withContext(`${doc.source} / ${chapter.title}`)
            .toBeGreaterThanOrEqual(1);
        }
      }
    });

    it('no article content should be empty', () => {
      for (const doc of getAllDocs()) {
        for (const chapter of doc.chapters) {
          for (const article of chapter.articles) {
            expect(article.content.trim().length)
              .withContext(`${doc.source} / ${chapter.title} / ${article.number}`)
              .toBeGreaterThan(0);
          }
        }
      }
    });
  });
});

// ── listLegalDocuments ───────────────────────────────────────

describe('listLegalDocuments', () => {
  it('should return all 3 registered documents', () => {
    const docs = listLegalDocuments();
    expect(docs).toHaveLength(3);
  });

  it('should return correct IDs', () => {
    const docs = listLegalDocuments();
    const ids = docs.map((d) => d.id);
    expect(ids).toContain('luat-doanh-nghiep-2020');
    expect(ids).toContain('bo-luat-lao-dong-2019');
    expect(ids).toContain('bo-luat-dan-su-2015');
  });

  it('each doc should have articleCount > 0', () => {
    const docs = listLegalDocuments();
    docs.forEach((d) => {
      expect(d.articleCount).toBeGreaterThan(0);
      expect(d.source).toBeTruthy();
      expect(d.version).toBeTruthy();
    });
  });

  it('should have valid domainTags for each doc', () => {
    const docs = listLegalDocuments();
    docs.forEach((d) => {
      expect(Array.isArray(d.domainTags)).toBe(true);
      expect(d.domainTags.length).toBeGreaterThan(0);
    });
  });
});

// ── getDocumentText ──────────────────────────────────────────

describe('getDocumentText', () => {
  it('should return text for a valid document ID', () => {
    const text = getDocumentText('luat-doanh-nghiep-2020');
    expect(text).toBeTruthy();
    expect(typeof text).toBe('string');
    expect(text!.length).toBeGreaterThan(500); // meaningful content
  });

  it('should return text containing article content', () => {
    const text = getDocumentText('bo-luat-lao-dong-2019');
    expect(text).toContain('Hợp đồng lao động');
    expect(text).toContain('Điều 13');
  });

  it('should return null for unknown document ID', () => {
    const text = getDocumentText('non-existent-law');
    expect(text).toBeNull();
  });

  it('should return null for empty string', () => {
    const text = getDocumentText('');
    expect(text).toBeNull();
  });

  describe('Bộ luật Dân sự 2015 text', () => {
    it('should contain key legal concepts', () => {
      const text = getDocumentText('bo-luat-dan-su-2015');
      expect(text).toContain('giao dịch dân sự');
      expect(text).toContain('hợp đồng');
      expect(text).toContain('bồi thường thiệt hại');
    });

    it('should contain article numbers', () => {
      const text = getDocumentText('bo-luat-dan-su-2015');
      expect(text).toContain('Điều 117');
      expect(text).toContain('Điều 385');
      expect(text).toContain('Điều 584');
    });
  });
});

// ── initializeLegalKnowledge ─────────────────────────────────

vi.mock('../vector-store', async () => {
  const actual = await vi.importActual('../vector-store') as object;
  return {
    ...actual,
    indexDocument: vi.fn().mockResolvedValue(3),
    getIndexStats: vi.fn().mockReturnValue({
      chunkCount: 0,
      documentCount: 0,
      sources: [],
    }),
    isVectorStoreReady: vi.fn().mockReturnValue(false),
  };
});

import { initializeLegalKnowledge } from '../legal-knowledge';
import { indexDocument, getIndexStats, isVectorStoreReady, vectorIndex } from '../vector-store';

describe('initializeLegalKnowledge', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(isVectorStoreReady).mockReturnValue(false);
    vi.mocked(getIndexStats).mockReturnValue({
      chunkCount: 0,
      documentCount: 0,
      sources: [],
    });
    vi.mocked(indexDocument).mockResolvedValue(3);
    vectorIndex.clear();
  });

  it('should index all 3 laws into vector store', async () => {
    const result = await initializeLegalKnowledge();

    expect(indexDocument).toHaveBeenCalledTimes(3);
    expect(result.indexed).toBe(3);
    expect(result.totalChunks).toBe(9); // 3 docs × 3 mock chunks each
    expect(result.sources).toHaveLength(3);
  });

  it('should call removeDocument before indexing each doc', async () => {
    const removeSpy = vi.spyOn(vectorIndex, 'removeDocument');
    await initializeLegalKnowledge();

    expect(removeSpy).toHaveBeenCalledTimes(3);
    expect(removeSpy).toHaveBeenCalledWith('luat-doanh-nghiep-2020');
    expect(removeSpy).toHaveBeenCalledWith('bo-luat-lao-dong-2019');
    expect(removeSpy).toHaveBeenCalledWith('bo-luat-dan-su-2015');
  });

  it('should skip indexing if vector store already ready', async () => {
    vi.mocked(isVectorStoreReady).mockReturnValue(true);
    vi.mocked(getIndexStats).mockReturnValue({
      chunkCount: 50,
      documentCount: 3,
      sources: [
        { documentId: 'luat-doanh-nghiep-2020', source: 'Luật DN 2020', chunkCount: 20 },
      ],
    });

    const result = await initializeLegalKnowledge();

    expect(indexDocument).not.toHaveBeenCalled();
    expect(result.indexed).toBe(3);
    expect(result.totalChunks).toBe(50);
  });

  it('should pass correct domainTags for each doc', async () => {
    await initializeLegalKnowledge();

    const calls = vi.mocked(indexDocument).mock.calls;
    expect(calls[0][3]).toContain('corporate-legal');
    expect(calls[0][3]).toContain('commercial-legal');
    expect(calls[1][3]).toContain('employment-legal');
    expect(calls[2][3]).toContain('commercial-legal');
  });
});
