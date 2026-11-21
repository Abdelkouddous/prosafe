import React from "react";
import { Image, Modal, StyleSheet, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { VideoView, useVideoPlayer } from "expo-video";
import type { IncidentMedia } from "@/services/incidentApi";

interface Props {
  media: IncidentMedia | null;
  uri: string;
  headers: Record<string, string>;
  onClose: () => void;
}

function VideoPlayer({ uri, headers }: { uri: string; headers: Record<string, string> }) {
  const player = useVideoPlayer({ uri, headers }, (p) => {
    p.play();
  });
  return (
    <VideoView
      player={player}
      style={styles.media}
      allowsFullscreen
      nativeControls
      contentFit="contain"
    />
  );
}

/** Full-screen viewer for an authenticated image or video from GET /files/:id */
export function MediaViewer({ media, uri, headers, onClose }: Props) {
  return (
    <Modal visible={!!media} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        {media?.kind === "video" ? (
          <VideoPlayer uri={uri} headers={headers} />
        ) : media ? (
          <Image source={{ uri, headers }} style={styles.media} resizeMode="contain" />
        ) : null}
        <TouchableOpacity style={styles.close} onPress={onClose} accessibilityRole="button">
          <Ionicons name="close" size={28} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.95)", justifyContent: "center" },
  media: { width: "100%", height: "80%" },
  close: { position: "absolute", top: 50, right: 20, padding: 8 },
});
