// swift-tools-version: 5.9
import PackageDescription

let package = Package(
    name: "MyCustomPlugin",
    platforms: [.iOS(.v14)],
    products: [
        .library(
            name: "MyCustomPlugin",
            targets: ["JitCallPlugin"])
    ],
    dependencies: [
        .package(url: "https://github.com/ionic-team/capacitor-swift-pm.git", from: "7.0.0")
    ],
    targets: [
        .target(
            name: "JitCallPlugin",
            dependencies: [
                .product(name: "Capacitor", package: "capacitor-swift-pm"),
                .product(name: "Cordova", package: "capacitor-swift-pm")
            ],
            path: "ios/Sources/JitCallPlugin"),
        .testTarget(
            name: "JitCallPluginTests",
            dependencies: ["JitCallPlugin"],
            path: "ios/Tests/JitCallPluginTests")
    ]
)