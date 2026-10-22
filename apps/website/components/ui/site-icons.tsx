"use client";

import type { ComponentType, Ref, RefAttributes, SVGAttributes } from "react";
import { useEffect, useRef } from "react";
import {
  Activity,
  AppWindow,
  Circle,
  FileInput,
  Fingerprint,
  KeyRound,
  ScanLine,
  TriangleAlert,
  Info,
  Trash2,
} from "lucide-react";
import { bindIconInteraction, type IconAnimation } from "./icon-interaction";
import { AlignLeftIcon as AnimatedAlignLeftIcon } from "./lucide-animated/align-left";
import { ArchiveIcon as AnimatedArchiveIcon } from "./lucide-animated/archive";
import { ArrowLeftIcon as AnimatedArrowLeftIcon } from "./lucide-animated/arrow-left";
import { ArrowRightIcon as AnimatedArrowRightIcon } from "./lucide-animated/arrow-right";
import { ArrowUpRightIcon as AnimatedArrowUpRightIcon } from "./lucide-animated/arrow-up-right";
import { BinaryIcon as AnimatedBinaryIcon } from "./lucide-animated/binary";
import { BlocksIcon as AnimatedBlocksIcon } from "./lucide-animated/blocks";
import { BoxIcon as AnimatedBoxIcon } from "./lucide-animated/box";
import { ChartNoAxesColumnIncreasingIcon as AnimatedChartNoAxesColumnIncreasingIcon } from "./lucide-animated/chart-no-axes-column-increasing";
import { CheckIcon as AnimatedCheckIcon } from "./lucide-animated/check";
import { ChevronDownIcon as AnimatedChevronDownIcon } from "./lucide-animated/chevron-down";
import { ChevronLeftIcon as AnimatedChevronLeftIcon } from "./lucide-animated/chevron-left";
import { ChevronRightIcon as AnimatedChevronRightIcon } from "./lucide-animated/chevron-right";
import { CircleCheckIcon as AnimatedCircleCheckIcon } from "./lucide-animated/circle-check";
import { ClockIcon as AnimatedClockIcon } from "./lucide-animated/clock";
import { CopyIcon as AnimatedCopyIcon } from "./lucide-animated/copy";
import { DiscordIcon as AnimatedDiscordIcon } from "./lucide-animated/discord";
import { DownloadIcon as AnimatedDownloadIcon } from "./lucide-animated/download";
import { EarthIcon as AnimatedEarthIcon } from "./lucide-animated/earth";
import { ExternalLinkIcon as AnimatedExternalLinkIcon } from "./lucide-animated/external-link";
import { FileTextIcon as AnimatedFileTextIcon } from "./lucide-animated/file-text";
import { GithubIcon as AnimatedGithubIcon } from "./lucide-animated/github";
import { HomeIcon as AnimatedHomeIcon } from "./lucide-animated/home";
import { IdCardIcon as AnimatedIdCardIcon } from "./lucide-animated/id-card";
import { LayersIcon as AnimatedLayersIcon } from "./lucide-animated/layers";
import { Link2Icon as AnimatedLink2Icon } from "./lucide-animated/link-2";
import { LoaderCircleIcon as AnimatedLoaderCircleIcon } from "./lucide-animated/loader-circle";
import { LockKeyholeIcon as AnimatedLockKeyholeIcon } from "./lucide-animated/lock-keyhole";
import { MenuIcon as AnimatedMenuIcon } from "./lucide-animated/menu";
import { MessageCircleIcon as AnimatedMessageCircleIcon } from "./lucide-animated/message-circle";
import { MoonIcon as AnimatedMoonIcon } from "./lucide-animated/moon";
import { PaletteIcon as AnimatedPaletteIcon } from "./lucide-animated/palette";
import { PlayIcon as AnimatedPlayIcon } from "./lucide-animated/play";
import { RefreshCWIcon as AnimatedRefreshCWIcon } from "./lucide-animated/refresh-cw";
import { RocketIcon as AnimatedRocketIcon } from "./lucide-animated/rocket";
import { SearchIcon as AnimatedSearchIcon } from "./lucide-animated/search";
import { SendIcon as AnimatedSendIcon } from "./lucide-animated/send";
import { SettingsIcon as AnimatedSettingsIcon } from "./lucide-animated/settings";
import { SparklesIcon as AnimatedSparklesIcon } from "./lucide-animated/sparkles";
import { SquareStackIcon as AnimatedSquareStackIcon } from "./lucide-animated/square-stack";
import { SunIcon as AnimatedSunIcon } from "./lucide-animated/sun";
import { TerminalIcon as AnimatedTerminalIcon } from "./lucide-animated/terminal";
import { TimerIcon as AnimatedTimerIcon } from "./lucide-animated/timer";
import { UserIcon as AnimatedUserIcon } from "./lucide-animated/user";
import { UsersRoundIcon as AnimatedUsersRoundIcon } from "./lucide-animated/users-round";
import { XIcon as AnimatedXIcon } from "./lucide-animated/x";
import { ZapIcon as AnimatedZapIcon } from "./lucide-animated/zap";

type IconProps = SVGAttributes<SVGSVGElement>;
type AnimatedIcon = ComponentType<
  IconProps & {
    size?: number;
    svgRef?: Ref<SVGSVGElement>;
  } & RefAttributes<IconAnimation>
>;

// Preserve the site's SVG interface and layout while using the upstream motion.
function siteIcon(Icon: AnimatedIcon, name: string) {
  return function SiteIcon({ className, ...props }: IconProps) {
    const svg = useRef<SVGSVGElement>(null);
    const animation = useRef<IconAnimation>(null);
    useEffect(() => {
      if (!svg.current || !animation.current) return;
      return bindIconInteraction(svg.current, animation.current);
    }, []);
    return (
      <Icon
        aria-hidden="true"
        {...props}
        ref={animation}
        svgRef={svg}
        data-icon={name}
        data-icon-library="lucide-animated"
        size={15}
        width={15}
        height={15}
        className={`site-icon ${className ?? ""}`}
      />
    );
  };
}

// Keep semantic glyphs where Lucide Animated does not yet offer an equivalent.
function staticIcon(
  Icon: ComponentType<IconProps>,
  name: string,
  filled = false
) {
  return function SiteIcon({ className, ...props }: IconProps) {
    return (
      <Icon
        aria-hidden="true"
        {...props}
        data-icon={name}
        width={15}
        height={15}
        fill={filled ? "currentColor" : "none"}
        className={`site-icon ${className ?? ""}`}
      />
    );
  };
}

export const ArchiveIcon = siteIcon(AnimatedArchiveIcon, "ArchiveIcon");
export const ActivityIcon = staticIcon(Activity, "ActivityIcon");
export const AppWindowIcon = staticIcon(AppWindow, "AppWindowIcon");
export const FingerprintIcon = staticIcon(Fingerprint, "FingerprintIcon");
export const KeyRoundIcon = staticIcon(KeyRound, "KeyRoundIcon");
export const FileInputIcon = staticIcon(FileInput, "FileInputIcon");
export const ScanLineIcon = staticIcon(ScanLine, "ScanLineIcon");
export const ArrowLeftIcon = siteIcon(AnimatedArrowLeftIcon, "ArrowLeftIcon");
export const ArrowRightIcon = siteIcon(
  AnimatedArrowRightIcon,
  "ArrowRightIcon"
);
export const ArrowTopRightIcon = siteIcon(
  AnimatedArrowUpRightIcon,
  "ArrowTopRightIcon"
);
export const AvatarIcon = siteIcon(AnimatedUserIcon, "AvatarIcon");
export const BarChartIcon = siteIcon(
  AnimatedChartNoAxesColumnIncreasingIcon,
  "BarChartIcon"
);
export const CardStackPlusIcon = siteIcon(
  AnimatedSquareStackIcon,
  "CardStackPlusIcon"
);
export const ChatBubbleIcon = siteIcon(
  AnimatedMessageCircleIcon,
  "ChatBubbleIcon"
);
export const CheckCircledIcon = siteIcon(
  AnimatedCircleCheckIcon,
  "CheckCircledIcon"
);
export const CheckIcon = siteIcon(AnimatedCheckIcon, "CheckIcon");
export const ChevronDownIcon = siteIcon(
  AnimatedChevronDownIcon,
  "ChevronDownIcon"
);
export const ChevronLeftIcon = siteIcon(
  AnimatedChevronLeftIcon,
  "ChevronLeftIcon"
);
export const ChevronRightIcon = siteIcon(
  AnimatedChevronRightIcon,
  "ChevronRightIcon"
);
export const ClockIcon = siteIcon(AnimatedClockIcon, "ClockIcon");
export const CodeIcon = siteIcon(AnimatedTerminalIcon, "CodeIcon");
export const ColorWheelIcon = siteIcon(AnimatedPaletteIcon, "ColorWheelIcon");
export const Component2Icon = siteIcon(AnimatedBlocksIcon, "Component2Icon");
export const CopyIcon = siteIcon(AnimatedCopyIcon, "CopyIcon");
export const Cross2Icon = siteIcon(AnimatedXIcon, "Cross2Icon");
export const CubeIcon = siteIcon(AnimatedBoxIcon, "CubeIcon");
export const DiscordLogoIcon = siteIcon(AnimatedDiscordIcon, "DiscordLogoIcon");
export const DownloadIcon = siteIcon(AnimatedDownloadIcon, "DownloadIcon");
export const ExternalLinkIcon = siteIcon(
  AnimatedExternalLinkIcon,
  "ExternalLinkIcon"
);
export const FileTextIcon = siteIcon(AnimatedFileTextIcon, "FileTextIcon");
export const GearIcon = siteIcon(AnimatedSettingsIcon, "GearIcon");
export const GitHubLogoIcon = siteIcon(AnimatedGithubIcon, "GitHubLogoIcon");
export const GlobeIcon = siteIcon(AnimatedEarthIcon, "GlobeIcon");
export const GroupIcon = siteIcon(AnimatedUsersRoundIcon, "GroupIcon");
export const HamburgerMenuIcon = siteIcon(
  AnimatedMenuIcon,
  "HamburgerMenuIcon"
);
export const HomeIcon = siteIcon(AnimatedHomeIcon, "HomeIcon");
export const IdCardIcon = siteIcon(AnimatedIdCardIcon, "IdCardIcon");
export const LayersIcon = siteIcon(AnimatedLayersIcon, "LayersIcon");
export const LightningBoltIcon = siteIcon(AnimatedZapIcon, "LightningBoltIcon");
export const Link2Icon = siteIcon(AnimatedLink2Icon, "Link2Icon");
export const ListBulletIcon = siteIcon(AnimatedAlignLeftIcon, "ListBulletIcon");
export const LockClosedIcon = siteIcon(
  AnimatedLockKeyholeIcon,
  "LockClosedIcon"
);
export const MagicWandIcon = siteIcon(AnimatedSparklesIcon, "MagicWandIcon");
export const MagnifyingGlassIcon = siteIcon(
  AnimatedSearchIcon,
  "MagnifyingGlassIcon"
);
export const MoonIcon = siteIcon(AnimatedMoonIcon, "MoonIcon");
export const PaperPlaneIcon = siteIcon(AnimatedSendIcon, "PaperPlaneIcon");
export const PersonIcon = siteIcon(AnimatedUserIcon, "PersonIcon");
export const PlayIcon = siteIcon(AnimatedPlayIcon, "PlayIcon");
export const ReloadIcon = siteIcon(AnimatedRefreshCWIcon, "ReloadIcon");
export const RocketIcon = siteIcon(AnimatedRocketIcon, "RocketIcon");
export const SunIcon = siteIcon(AnimatedSunIcon, "SunIcon");
export const TimerIcon = siteIcon(AnimatedTimerIcon, "TimerIcon");
export const TokensIcon = siteIcon(AnimatedBinaryIcon, "TokensIcon");
export const UpdateIcon = siteIcon(AnimatedLoaderCircleIcon, "UpdateIcon");
export const DotFilledIcon = staticIcon(Circle, "DotFilledIcon", true);
export const ExclamationTriangleIcon = staticIcon(
  TriangleAlert,
  "ExclamationTriangleIcon"
);
export const InfoCircledIcon = staticIcon(Info, "InfoCircledIcon");
export const TrashIcon = staticIcon(Trash2, "TrashIcon");
