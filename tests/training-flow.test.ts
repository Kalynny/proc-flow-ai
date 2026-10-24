import { describe, expect, test } from "bun:test";
import { assessmentPath, trainingVideo } from "../src/lib/training-flow";

describe("training-specific assessments", () => {
  test("opens only the selected training's assessment", () => {
    expect(assessmentPath("training-a", { id: "exam-a", procedimento_id: "training-a" })).toBe("/procedimento/training-a/prova/exam-a");
    expect(assessmentPath("training-b", { id: "exam-b", procedimento_id: "training-b" })).toBe("/procedimento/training-b/prova/exam-b");
  });
  test("rejects an assessment linked to another training", () => {
    expect(assessmentPath("training-a", { id: "exam-b", procedimento_id: "training-b" })).toBeNull();
  });
  test("does not supply an exam destination when none is registered", () => {
    expect(assessmentPath("training-a", null)).toBeNull();
  });
});

describe("inline video URLs", () => {
  test("converts a Google Drive video link into an inline preview", () => {
    expect(trainingVideo("https://drive.google.com/file/d/video-a/view?usp=sharing")).toEqual({ kind: "iframe", src: "https://drive.google.com/file/d/video-a/preview" });
  });
  test("converts YouTube links and recognizes uploaded videos", () => {
    expect(trainingVideo("https://youtu.be/video-a")).toEqual({ kind: "iframe", src: "https://www.youtube.com/embed/video-a" });
    expect(trainingVideo("https://example.com/video.mp4")).toEqual({ kind: "video", src: "https://example.com/video.mp4" });
  });
  test("does not embed unsafe URLs or unrelated Drive folders", () => {
    expect(trainingVideo("javascript:alert(1)")).toBeNull();
    expect(trainingVideo("https://drive.google.com/drive/folders/folder-a")).toBeNull();
    expect(trainingVideo("https://youtube.com.evil.example/watch?v=a")).toBeNull();
  });
});