import React from "react"
import { View, Dimensions } from "react-native"

const { width: screenWidth } = Dimensions.get("window")

export default function ResponsiveGrid({ children, columns = 2, spacing = 12, style }) {
  const childrenArray = React.Children.toArray(children)
  const rows = []

  // Calculate item width
  const totalSpacing = (columns - 1) * spacing
  const itemWidth = (screenWidth - totalSpacing - 40) / columns // 40 for container padding

  for (let i = 0; i < childrenArray.length; i += columns) {
    const rowChildren = childrenArray.slice(i, i + columns)
    rows.push(
      <View key={i} style={{ flexDirection: "row", marginBottom: spacing }}>
        {rowChildren.map((child, index) => (
          <View
            key={index}
            style={{
              width: itemWidth,
              marginRight: index < rowChildren.length - 1 ? spacing : 0,
            }}
          >
            {child}
          </View>
        ))}
      </View>,
    )
  }

  return <View style={style}>{rows}</View>
}
