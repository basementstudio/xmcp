import type { ComponentProps } from "react";
import {
  ArchiveIcon as RadixArchiveIcon,
  ArrowLeftIcon as RadixArrowLeftIcon,
  ArrowRightIcon as RadixArrowRightIcon,
  ArrowTopRightIcon as RadixArrowTopRightIcon,
  AvatarIcon as RadixAvatarIcon,
  BarChartIcon as RadixBarChartIcon,
  CardStackPlusIcon as RadixCardStackPlusIcon,
  ChatBubbleIcon as RadixChatBubbleIcon,
  CheckCircledIcon as RadixCheckCircledIcon,
  CheckIcon as RadixCheckIcon,
  ChevronDownIcon as RadixChevronDownIcon,
  ChevronLeftIcon as RadixChevronLeftIcon,
  ChevronRightIcon as RadixChevronRightIcon,
  ClockIcon as RadixClockIcon,
  CodeIcon as RadixCodeIcon,
  ColorWheelIcon as RadixColorWheelIcon,
  Component2Icon as RadixComponent2Icon,
  CopyIcon as RadixCopyIcon,
  Cross2Icon as RadixCross2Icon,
  CubeIcon as RadixCubeIcon,
  DiscordLogoIcon as RadixDiscordLogoIcon,
  DotFilledIcon as RadixDotFilledIcon,
  DownloadIcon as RadixDownloadIcon,
  ExclamationTriangleIcon as RadixExclamationTriangleIcon,
  ExternalLinkIcon as RadixExternalLinkIcon,
  FileTextIcon as RadixFileTextIcon,
  GearIcon as RadixGearIcon,
  GitHubLogoIcon as RadixGitHubLogoIcon,
  GlobeIcon as RadixGlobeIcon,
  GroupIcon as RadixGroupIcon,
  HamburgerMenuIcon as RadixHamburgerMenuIcon,
  HomeIcon as RadixHomeIcon,
  IdCardIcon as RadixIdCardIcon,
  InfoCircledIcon as RadixInfoCircledIcon,
  LayersIcon as RadixLayersIcon,
  LightningBoltIcon as RadixLightningBoltIcon,
  Link2Icon as RadixLink2Icon,
  ListBulletIcon as RadixListBulletIcon,
  LockClosedIcon as RadixLockClosedIcon,
  MagicWandIcon as RadixMagicWandIcon,
  MagnifyingGlassIcon as RadixMagnifyingGlassIcon,
  MoonIcon as RadixMoonIcon,
  PaperPlaneIcon as RadixPaperPlaneIcon,
  PersonIcon as RadixPersonIcon,
  PlayIcon as RadixPlayIcon,
  ReloadIcon as RadixReloadIcon,
  RocketIcon as RadixRocketIcon,
  SunIcon as RadixSunIcon,
  TimerIcon as RadixTimerIcon,
  TokensIcon as RadixTokensIcon,
  TrashIcon as RadixTrashIcon,
  UpdateIcon as RadixUpdateIcon,
} from "@radix-ui/react-icons";

// Keep icons server-renderable; the shared Motion controller handles interactions.
function siteIcon(Icon: typeof RadixCodeIcon, name: string) {
  return function SiteIcon({
    className,
    ...props
  }: ComponentProps<typeof RadixCodeIcon>) {
    return (
      <Icon
        aria-hidden="true"
        {...props}
        data-icon={name}
        width={15}
        height={15}
        className={`site-icon ${className ?? ""}`}
      />
    );
  };
}

export const ArchiveIcon = siteIcon(RadixArchiveIcon, "ArchiveIcon");
export const ArrowLeftIcon = siteIcon(RadixArrowLeftIcon, "ArrowLeftIcon");
export const ArrowRightIcon = siteIcon(RadixArrowRightIcon, "ArrowRightIcon");
export const ArrowTopRightIcon = siteIcon(
  RadixArrowTopRightIcon,
  "ArrowTopRightIcon"
);
export const AvatarIcon = siteIcon(RadixAvatarIcon, "AvatarIcon");
export const BarChartIcon = siteIcon(RadixBarChartIcon, "BarChartIcon");
export const CardStackPlusIcon = siteIcon(
  RadixCardStackPlusIcon,
  "CardStackPlusIcon"
);
export const ChatBubbleIcon = siteIcon(RadixChatBubbleIcon, "ChatBubbleIcon");
export const CheckCircledIcon = siteIcon(
  RadixCheckCircledIcon,
  "CheckCircledIcon"
);
export const CheckIcon = siteIcon(RadixCheckIcon, "CheckIcon");
export const ChevronDownIcon = siteIcon(
  RadixChevronDownIcon,
  "ChevronDownIcon"
);
export const ChevronLeftIcon = siteIcon(
  RadixChevronLeftIcon,
  "ChevronLeftIcon"
);
export const ChevronRightIcon = siteIcon(
  RadixChevronRightIcon,
  "ChevronRightIcon"
);
export const ClockIcon = siteIcon(RadixClockIcon, "ClockIcon");
export const CodeIcon = siteIcon(RadixCodeIcon, "CodeIcon");
export const ColorWheelIcon = siteIcon(RadixColorWheelIcon, "ColorWheelIcon");
export const Component2Icon = siteIcon(RadixComponent2Icon, "Component2Icon");
export const CopyIcon = siteIcon(RadixCopyIcon, "CopyIcon");
export const Cross2Icon = siteIcon(RadixCross2Icon, "Cross2Icon");
export const CubeIcon = siteIcon(RadixCubeIcon, "CubeIcon");
export const DiscordLogoIcon = siteIcon(
  RadixDiscordLogoIcon,
  "DiscordLogoIcon"
);
export const DotFilledIcon = siteIcon(RadixDotFilledIcon, "DotFilledIcon");
export const DownloadIcon = siteIcon(RadixDownloadIcon, "DownloadIcon");
export const ExclamationTriangleIcon = siteIcon(
  RadixExclamationTriangleIcon,
  "ExclamationTriangleIcon"
);
export const ExternalLinkIcon = siteIcon(
  RadixExternalLinkIcon,
  "ExternalLinkIcon"
);
export const FileTextIcon = siteIcon(RadixFileTextIcon, "FileTextIcon");
export const GearIcon = siteIcon(RadixGearIcon, "GearIcon");
export const GitHubLogoIcon = siteIcon(RadixGitHubLogoIcon, "GitHubLogoIcon");
export const GlobeIcon = siteIcon(RadixGlobeIcon, "GlobeIcon");
export const GroupIcon = siteIcon(RadixGroupIcon, "GroupIcon");
export const HamburgerMenuIcon = siteIcon(
  RadixHamburgerMenuIcon,
  "HamburgerMenuIcon"
);
export const HomeIcon = siteIcon(RadixHomeIcon, "HomeIcon");
export const IdCardIcon = siteIcon(RadixIdCardIcon, "IdCardIcon");
export const InfoCircledIcon = siteIcon(
  RadixInfoCircledIcon,
  "InfoCircledIcon"
);
export const LayersIcon = siteIcon(RadixLayersIcon, "LayersIcon");
export const LightningBoltIcon = siteIcon(
  RadixLightningBoltIcon,
  "LightningBoltIcon"
);
export const Link2Icon = siteIcon(RadixLink2Icon, "Link2Icon");
export const ListBulletIcon = siteIcon(RadixListBulletIcon, "ListBulletIcon");
export const LockClosedIcon = siteIcon(RadixLockClosedIcon, "LockClosedIcon");
export const MagicWandIcon = siteIcon(RadixMagicWandIcon, "MagicWandIcon");
export const MagnifyingGlassIcon = siteIcon(
  RadixMagnifyingGlassIcon,
  "MagnifyingGlassIcon"
);
export const MoonIcon = siteIcon(RadixMoonIcon, "MoonIcon");
export const PaperPlaneIcon = siteIcon(RadixPaperPlaneIcon, "PaperPlaneIcon");
export const PersonIcon = siteIcon(RadixPersonIcon, "PersonIcon");
export const PlayIcon = siteIcon(RadixPlayIcon, "PlayIcon");
export const ReloadIcon = siteIcon(RadixReloadIcon, "ReloadIcon");
export const RocketIcon = siteIcon(RadixRocketIcon, "RocketIcon");
export const SunIcon = siteIcon(RadixSunIcon, "SunIcon");
export const TimerIcon = siteIcon(RadixTimerIcon, "TimerIcon");
export const TokensIcon = siteIcon(RadixTokensIcon, "TokensIcon");
export const TrashIcon = siteIcon(RadixTrashIcon, "TrashIcon");
export const UpdateIcon = siteIcon(RadixUpdateIcon, "UpdateIcon");
