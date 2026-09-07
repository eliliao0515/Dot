import React, { useState } from 'react';
import { View, SafeAreaView, StatusBar, Platform, Pressable, StyleSheet } from 'react-native';
import { StatusBar as ExpoStatusBar } from 'expo-status-bar';
import { ScaleProvider, T, useScale } from './src/ui/Scale';
import { C, fz } from './src/ui/theme';
import { LESSONS } from './src/content/lessons';
import ChatSim from './src/sim/ChatSim';
import MapScreen from './src/shell/MapScreen';
import { BriefScreen, RealDeviceScreen, DoneScreen } from './src/shell/LessonScreens';

type Route =
  | { name: 'map' }
  | { name: 'brief'; lessonId: string }
  | { name: 'sim'; lessonId: string; stageIndex: number }
  | { name: 'realDevice'; lessonId: string }
  | { name: 'done'; lessonId: string };

const STAGE_LABEL: Record<string, string> = {
  guided: '帶著做',
  solo: '自己做',
  transfer: '真的做',
};

/**
 * 模擬畫面上方唯一的一條外框。
 * 用靛藍是刻意的 — 讓長輩隨時看得出「藍色是老師，綠色是要學的 App」。
 */
function TeachingFrame({
  stageIndex,
  total,
  stage,
  onExit,
}: {
  stageIndex: number;
  total: number;
  stage: string;
  onExit: () => void;
}) {
  const { base } = useScale();
  return (
    <View style={s.frame}>
      <T systemScaling style={[s.frameText, { fontSize: fz(base, 0.78), lineHeight: fz(base, 1.3) }]}>
        {`練習 ${stageIndex + 1} / ${total}　${STAGE_LABEL[stage] ?? ''}`}
      </T>
      <Pressable onPress={onExit} hitSlop={14} accessibilityRole="button">
        <T systemScaling style={[s.frameExit, { fontSize: fz(base, 0.78), lineHeight: fz(base, 1.3) }]}>
          先離開
        </T>
      </Pressable>
    </View>
  );
}

function Root() {
  const [route, setRoute] = useState<Route>({ name: 'map' });
  const lesson = 'lessonId' in route ? LESSONS[route.lessonId] : undefined;

  function advance() {
    if (route.name !== 'sim' || !lesson) return;
    const next = route.stageIndex + 1;
    if (next < lesson.stages.length) {
      setRoute({ name: 'sim', lessonId: lesson.id, stageIndex: next });
    } else {
      setRoute({ name: 'realDevice', lessonId: lesson.id });
    }
  }

  return (
    <SafeAreaView style={s.safe}>
      <ExpoStatusBar style="dark" />

      {route.name === 'map' ? (
        <MapScreen
          resumeLabel="傳一段語音給女兒"
          onOpenLesson={(lessonId) => setRoute({ name: 'brief', lessonId })}
        />
      ) : null}

      {route.name === 'brief' && lesson ? (
        <BriefScreen
          lesson={lesson}
          onBack={() => setRoute({ name: 'map' })}
          onStart={() => setRoute({ name: 'sim', lessonId: lesson.id, stageIndex: 0 })}
        />
      ) : null}

      {route.name === 'sim' && lesson ? (
        <View style={{ flex: 1 }}>
          <TeachingFrame
            stageIndex={route.stageIndex}
            total={lesson.stages.length}
            stage={lesson.stages[route.stageIndex].stage}
            onExit={() => setRoute({ name: 'map' })}
          />
          <ChatSim
            key={`${lesson.id}-${route.stageIndex}`}
            lesson={lesson}
            script={lesson.stages[route.stageIndex]}
            onDone={advance}
          />
        </View>
      ) : null}

      {route.name === 'realDevice' && lesson ? (
        <RealDeviceScreen
          lesson={lesson}
          onConfirm={() => setRoute({ name: 'done', lessonId: lesson.id })}
          onLater={() => setRoute({ name: 'done', lessonId: lesson.id })}
        />
      ) : null}

      {route.name === 'done' && lesson ? (
        <DoneScreen
          lesson={lesson}
          onShare={() => setRoute({ name: 'map' })}
          onBack={() => setRoute({ name: 'map' })}
        />
      ) : null}
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <ScaleProvider>
      <Root />
    </ScaleProvider>
  );
}

const s = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: C.paper,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight ?? 0 : 0,
  },
  frame: {
    backgroundColor: C.indigoDark,
    paddingHorizontal: 16,
    paddingVertical: 7,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  frameText: { color: '#B9CEDC', fontWeight: '700', flex: 1 },
  frameExit: { color: '#fff', fontWeight: '700', textDecorationLine: 'underline' },
});
