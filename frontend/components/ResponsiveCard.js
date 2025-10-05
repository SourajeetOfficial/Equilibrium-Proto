import { View, Dimensions } from "react-native"

const { width: screenWidth } = Dimensions.get("window")
const isTablet = screenWidth > 768

export default function ResponsiveCard({
  children,
  style,
  backgroundColor = "rgba(255, 255, 255, 0.9)",
  padding,
  margin,
  ...props
}) {
  const defaultPadding = isTablet ? 20 : 16
  const defaultMargin = isTablet ? 12 : 8

  const cardStyle = {
    backgroundColor,
    borderRadius: isTablet ? 16 : 12,
    padding: padding !== undefined ? padding : defaultPadding,
    margin: margin !== undefined ? margin : defaultMargin,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    ...style,
  }

  return (
    <View style={cardStyle} {...props}>
      {children}
    </View>
  )
}
