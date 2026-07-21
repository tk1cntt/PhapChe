/**
 * AiAnnotationContent Tests
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { AiAnnotationContent } from '../AiAnnotationContent';

describe('AiAnnotationContent', () => {
  const sampleContent = [
    '**Vấn đề:** Phí dịch vụ không được ấn định cụ thể trong hợp đồng.',
    '**Đề xuất:** Ghi rõ tổng phí dịch vụ bằng số và chữ.',
    '**Căn cứ:** Điều 398 Bộ luật Dân sự 2015.',
  ].join('\n');

  // ── Whitebox ──

  it('renders 3 sections with correct labels', () => {
    render(<AiAnnotationContent content={sampleContent} />);
    expect(screen.getByText('Vấn đề')).toBeDefined();
    expect(screen.getByText('Đề xuất')).toBeDefined();
    expect(screen.getByText('Căn cứ pháp lý')).toBeDefined();
  });

  it('renders section content text', () => {
    render(<AiAnnotationContent content={sampleContent} />);
    expect(screen.getByText(/Phí dịch vụ không được ấn định/)).toBeDefined();
    expect(screen.getByText(/Ghi rõ tổng phí/)).toBeDefined();
    expect(screen.getByText(/Điều 398/)).toBeDefined();
  });

  it('renders icons for each section', () => {
    const { container } = render(<AiAnnotationContent content={sampleContent} />);
    const issueIcon = container.querySelector('.ai-section--issue .ai-section-icon');
    const recIcon = container.querySelector('.ai-section--recommendation .ai-section-icon');
    const legalIcon = container.querySelector('.ai-section--legal .ai-section-icon');
    expect(issueIcon).not.toBeNull();
    expect(recIcon).not.toBeNull();
    expect(legalIcon).not.toBeNull();
  });

  // ── Blackbox ──

  it('applies compact class when compact=true', () => {
    const { container } = render(<AiAnnotationContent content={sampleContent} compact />);
    expect(container.querySelector('.ai-annotation-content--compact')).not.toBeNull();
  });

  it('does not apply compact class when compact=false', () => {
    const { container } = render(<AiAnnotationContent content={sampleContent} compact={false} />);
    expect(container.querySelector('.ai-annotation-content--compact')).toBeNull();
  });

  it('renders English labels (Issue, Recommendation, Legal Basis)', () => {
    const enContent = [
      '**Issue:** Missing payment terms.',
      '**Recommendation:** Add payment schedule.',
      '**Legal Basis:** Article 398.',
    ].join('\n');
    render(<AiAnnotationContent content={enContent} />);
    expect(screen.getByText('Issue')).toBeDefined();
    expect(screen.getByText('Recommendation')).toBeDefined();
    expect(screen.getByText('Legal Basis')).toBeDefined();
  });

  // ── Abnormal ──

  it('renders raw content for plain text (no sections)', () => {
    const plainText = 'Đây là ghi chú bình thường.';
    render(<AiAnnotationContent content={plainText} />);
    expect(screen.getByText(plainText)).toBeDefined();
  });

  it('renders raw content for single section only', () => {
    const singleSection = '**Vấn đề:** Chỉ có vấn đề thôi.';
    render(<AiAnnotationContent content={singleSection} />);
    expect(screen.getByText('Vấn đề')).toBeDefined();
    expect(screen.getByText('Chỉ có vấn đề thôi.')).toBeDefined();
  });

  // ── Error ──

  it('renders empty string without crash', () => {
    const { container } = render(<AiAnnotationContent content="" />);
    expect(container.querySelector('.ai-raw-content')).not.toBeNull();
  });

  it('renders whitespace-only content without crash', () => {
    const { container } = render(<AiAnnotationContent content="   " />);
    expect(container.querySelector('.ai-raw-content')).not.toBeNull();
  });
});
