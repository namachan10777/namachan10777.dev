import { useNavigation } from "react-router";
import * as styles from "./styles.css";

export function NavigationIndicator() {
  const navigation = useNavigation();
  if (navigation.state === "idle") return null;

  return (
    <div className={styles.container} aria-hidden="true">
      <div className={styles.bar} />
    </div>
  );
}
