/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Header, ActiveTab } from './components/Header';
import { SocraticChat } from './components/SocraticChat';
import { ConceptMindmap } from './components/ConceptMindmap';
import { FlashcardsView } from './components/FlashcardsView';
import { AdaptiveQuiz } from './components/AdaptiveQuiz';
import { FeynmanLab } from './components/FeynmanLab';
import { StepSolver } from './components/StepSolver';
import { StudyRoadmap } from './components/StudyRoadmap';
import { CornellNotes } from './components/CornellNotes';
import { AdaptivePathways } from './components/AdaptivePathways';
import { GroupStudyHub } from './components/GroupStudyHub';
import { EducatorDashboard } from './components/EducatorDashboard';
import { DocVisionLab } from './components/DocVisionLab';
import { SubjectCategory, GradeLevel } from './types';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('chat');
  const [selectedSubject, setSelectedSubject] = useState<SubjectCategory>('Computer Science & AI');
  const [gradeLevel, setGradeLevel] = useState<GradeLevel>('College / Undergraduate');
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [sharedTopic, setSharedTopic] = useState('');
  const [streakCount, setStreakCount] = useState(1);

  // Initialize or increment streak count on day change
  useEffect(() => {
    try {
      const today = new Date().toDateString();
      const lastVisit = localStorage.getItem('edugenie_last_visit');
      const savedStreak = Number(localStorage.getItem('edugenie_streak') || 1);

      if (lastVisit) {
        const lastDate = new Date(lastVisit);
        const diffDays = Math.floor((new Date(today).getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays === 1) {
          const nextStreak = savedStreak + 1;
          setStreakCount(nextStreak);
          localStorage.setItem('edugenie_streak', String(nextStreak));
        } else if (diffDays > 1) {
          setStreakCount(1);
          localStorage.setItem('edugenie_streak', '1');
        } else {
          setStreakCount(savedStreak);
        }
      } else {
        localStorage.setItem('edugenie_streak', '1');
      }
      localStorage.setItem('edugenie_last_visit', today);
    } catch (e) {
      console.error(e);
    }
  }, []);

  // Cross-feature handlers
  const handleOpenMindmap = (topic: string) => {
    setSharedTopic(topic);
    setActiveTab('mindmap');
  };

  const handleOpenQuiz = (topic: string) => {
    setSharedTopic(topic);
    setActiveTab('quiz');
  };

  const handleOpenFlashcards = (topic: string) => {
    setSharedTopic(topic);
    setActiveTab('flashcards');
  };

  const handleOpenChat = (topic: string) => {
    setSharedTopic(topic);
    setActiveTab('chat');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500/30 selection:text-indigo-200">
      {/* Global Navigation & App Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        selectedSubject={selectedSubject}
        setSelectedSubject={setSelectedSubject}
        gradeLevel={gradeLevel}
        setGradeLevel={setGradeLevel}
        isAudioPlaying={isAudioPlaying}
        setIsAudioPlaying={setIsAudioPlaying}
        streakCount={streakCount}
      />

      {/* Main Workspace Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto pb-10">
        {activeTab === 'chat' && (
          <SocraticChat
            subject={selectedSubject}
            gradeLevel={gradeLevel}
            onOpenMindmapForTopic={handleOpenMindmap}
            onOpenQuizForTopic={handleOpenQuiz}
            onOpenFlashcardsForTopic={handleOpenFlashcards}
            isAudioPlaying={isAudioPlaying}
            setIsAudioPlaying={setIsAudioPlaying}
          />
        )}

        {activeTab === 'docvision' && (
          <DocVisionLab
            subject={selectedSubject}
            gradeLevel={gradeLevel}
            onLaunchChat={handleOpenChat}
            onLaunchQuiz={handleOpenQuiz}
            onLaunchMindmap={handleOpenMindmap}
          />
        )}

        {activeTab === 'pathways' && (
          <AdaptivePathways
            subject={selectedSubject}
            gradeLevel={gradeLevel}
            onLaunchChat={handleOpenChat}
            onLaunchQuiz={handleOpenQuiz}
          />
        )}

        {activeTab === 'group' && (
          <GroupStudyHub
            subject={selectedSubject}
          />
        )}

        {activeTab === 'mindmap' && (
          <ConceptMindmap
            initialTopic={sharedTopic}
            subject={selectedSubject}
            onTestConcept={handleOpenQuiz}
          />
        )}

        {activeTab === 'flashcards' && (
          <FlashcardsView
            initialTopic={sharedTopic}
            subject={selectedSubject}
          />
        )}

        {activeTab === 'quiz' && (
          <AdaptiveQuiz
            initialTopic={sharedTopic}
            subject={selectedSubject}
            gradeLevel={gradeLevel}
            onExploreTopicInChat={handleOpenChat}
            onLaunchFlashcards={handleOpenFlashcards}
          />
        )}

        {activeTab === 'feynman' && (
          <FeynmanLab
            initialTopic={sharedTopic}
            subject={selectedSubject}
            gradeLevel={gradeLevel}
            onExploreInChat={handleOpenChat}
          />
        )}

        {activeTab === 'solver' && (
          <StepSolver
            subject={selectedSubject}
            gradeLevel={gradeLevel}
            onExploreInChat={handleOpenChat}
            onLaunchQuiz={handleOpenQuiz}
          />
        )}

        {activeTab === 'planner' && (
          <StudyRoadmap
            subject={selectedSubject}
            gradeLevel={gradeLevel}
            onLaunchQuiz={handleOpenQuiz}
            onLaunchChat={handleOpenChat}
            onLaunchFlashcards={handleOpenFlashcards}
          />
        )}

        {activeTab === 'notes' && (
          <CornellNotes
            subject={selectedSubject}
            gradeLevel={gradeLevel}
            onLaunchFlashcards={handleOpenFlashcards}
            onLaunchQuiz={handleOpenQuiz}
          />
        )}

        {activeTab === 'dashboard' && (
          <EducatorDashboard
            subject={selectedSubject}
          />
        )}
      </main>
    </div>
  );
}
