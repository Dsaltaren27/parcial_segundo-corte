import Foundation

@objc public class JitCall: NSObject {
    @objc public func echo(_ value: String) -> String {
        print(value)
        return value
    }
}
