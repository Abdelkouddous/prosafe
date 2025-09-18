import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { SymbolWeight, SymbolView } from "expo-symbols";
import React from "react";
import { OpaqueColorValue, Platform, StyleProp, ViewStyle } from "react-native";

const MAPPING = {
  "camera.fill": "camera",
  camera: "camera-alt",
  "message.fill": "message",
  message: "message",
  "person.fill": "person",
  person: "person-outline",
  "book.fill": "book",
  book: "book",
} as Partial<
  Record<string, React.ComponentProps<typeof MaterialIcons>["name"]>
>;

export type IconSymbolName = keyof typeof MAPPING;

export function IconSymbol({
  name,
  size = 24,
  color,
  style,
  weight = "regular",
}: {
  name: IconSymbolName;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<ViewStyle>;
  weight?: SymbolWeight;
}) {
  if (Platform.OS === "ios") {
    return (
      <SymbolView
        weight={weight}
        // tintColor={color}
        resizeMode="scaleAspectFit"
        name={name}
        style={[
          {
            width: size,
            height: size,
          },
          style,
        ]}
      />
    );
  } else {
    const iconName = MAPPING[name];
    if (!iconName) {
      return null;
    }

    return (
      <MaterialIcons color={color} size={size} name={iconName} style={style} />
    );
  }
}
