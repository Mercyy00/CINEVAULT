import { describe, it, expect } from 'vitest';
import { isComplete, isResumable, progressPercent, resumePosition } from '../playback';

describe('playback', () => {
  it('isComplete', () => {
    expect(isComplete(90)).toBe(true);
    expect(isComplete(89)).toBe(false);
  });

  it('isResumable', () => {
    expect(isResumable(50)).toBe(true);
    expect(isResumable(1)).toBe(false);
    expect(isResumable(95)).toBe(false);
  });

  it('progressPercent', () => {
    expect(progressPercent(60, 120)).toBe(50);
    expect(progressPercent(0, null)).toBeNull();
  });

  it('resumePosition', () => {
    expect(resumePosition(100)).toBe(95); // rewinds 5s
  });
});
