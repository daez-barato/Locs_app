import React, { useEffect, useState } from "react";
import { Image, ImageProps } from "expo-image";

const PLACEHOLDER = require("@/assets/images/placeholder-user-image.png");

type Props = Omit<ImageProps, "source"> & {
  /** An already-resolved URL — pass resolveAvatarUrl(path) for a stored path. */
  uri: string;
};

/**
 * An avatar that falls back to the bundled placeholder if the remote image
 * fails to load (offline, missing object), instead of rendering an empty box.
 */
export default function AvatarImage({ uri, onError, ...rest }: Props) {
  const [failed, setFailed] = useState(false);

  // A new avatar (e.g. just equipped) deserves a fresh attempt.
  useEffect(() => setFailed(false), [uri]);

  return (
    <Image
      {...rest}
      source={failed || !uri ? PLACEHOLDER : { uri }}
      onError={(e) => {
        setFailed(true);
        onError?.(e);
      }}
    />
  );
}
