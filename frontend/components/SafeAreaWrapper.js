import { View, StatusBar, Platform } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"

export default function SafeAreaWrapper({
  children,
  backgroundColor = "#ffffff",
  statusBarStyle = "dark-content",
  edges = ["top", "bottom", "left", "right"],
}) {
  const insets = useSafeAreaInsets()

  const paddingTop = edges.includes("top") ? insets.top : 0
  const paddingBottom = edges.includes("bottom") ? insets.bottom : 0
  const paddingLeft = edges.includes("left") ? insets.left : 0
  const paddingRight = edges.includes("right") ? insets.right : 0

  return (
    <View
      style={{
        flex: 1,
        backgroundColor,
        paddingTop,
        paddingBottom,
        paddingLeft,
        paddingRight,
      }}
    >
      <StatusBar
        barStyle={statusBarStyle}
        backgroundColor={Platform.OS === "android" ? backgroundColor : "transparent"}
        translucent={Platform.OS === "android"}
      />
      {children}
    </View>
  )
}
