import React, { useState, useRef } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Video from 'react-native-video';
import { GestureHandlerRootView, PanGestureHandler } from 'react-native-gesture-handler';
import Animated from 'react-native-reanimated';

interface EnhancedMediaPlayerProps {
  source: { uri: string };
  offlineSource?: string;
  title: string;
  onProgress?: (progress: number) => void;
  onComplete?: () => void;
}

export default function EnhancedMediaPlayer({ 
  source, 
  offlineSource, 
  title, 
  onProgress, 
  onComplete 
}: Readonly<EnhancedMediaPlayerProps>) {
  const [paused] = useState(false);
  // Removed unused currentTime state
  const [duration, setDuration] = useState(0);
  const [showControls] = useState(true);
  const videoRef = useRef<any>(null);

  const handleProgress = (data: any) => {
    onProgress?.(data.currentTime / duration);
  };

  const handleLoad = (data: any) => {
    setDuration(data.duration);
  };

  const handleEnd = () => {
    onComplete?.();
  };



  return (
    <GestureHandlerRootView style={styles.container}>
      <PanGestureHandler
        onHandlerStateChange={(event) => {
          // Handle gestures for seek, volume, brightness
          console.log('Gesture event:', event);
        }}
      >
        <Animated.View style={styles.videoContainer}>
          <Video
            ref={videoRef}
            source={offlineSource ? { uri: offlineSource } : source}
            style={styles.video}
            paused={paused}
            onProgress={handleProgress}
            onLoad={handleLoad}
            onEnd={handleEnd}
            resizeMode="contain"
            ignoreSilentSwitch="ignore"
            playInBackground={false}
            playWhenInactive={false}
          />
          
          {showControls && (
            <View style={styles.controls}>
              {/* Custom controls implementation */}
            </View>
          )}
        </Animated.View>
      </PanGestureHandler>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  videoContainer: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').width * 9/16,
  },
  video: {
    width: '100%',
    height: '100%',
  },
  controls: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 16,
  },
});