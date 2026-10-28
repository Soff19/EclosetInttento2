import type { ReactNode } from "react";
import LoginIllustration from "@/components/auth/LoginIllustration";
import styles from "../app/fashion-sections.module.css";

interface EditorialSectionBannerProps {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
  intro?: ReactNode;
  children?: ReactNode;
}

export default function EditorialSectionBanner({
  id,
  eyebrow,
  title,
  description,
  intro,
  children,
}: EditorialSectionBannerProps) {
  return (
    <section className={styles.sectionBanner} aria-labelledby={id}>
      <div className={styles.sectionBannerArt}>
        <LoginIllustration />
      </div>
      <div className={styles.sectionBannerWash} aria-hidden="true" />
      {intro && <div className={styles.sectionBannerIntro}>{intro}</div>}
      <div className={styles.sectionBannerCopy}>
        <p className={styles.sectionBannerEyebrow}>{eyebrow}</p>
        <h1 id={id} className={styles.sectionBannerTitle}>{title}</h1>
        <p className={styles.sectionBannerDescription}>{description}</p>
      </div>
      {children && <div className={styles.sectionBannerControls}>{children}</div>}
    </section>
  );
}
