import type IExtender from 'flarum/common/extenders/IExtender';
import app from 'flarum/forum/app';
import commonExtend from '../common/extend';

const buttonSelector = '.LogInModal .LogInButtons button, .LogInModal .LogInButtons a, .LogInModal .LogInButtons [role="button"]';
const tooltipId = 'LoginScreenTooltip';
const knownProviders = [
  'amazon',
  'apple',
  'bitbucket',
  'discord',
  'facebook',
  'github',
  'gitlab',
  'google',
  'line',
  'linkedin',
  'mastodon',
  'microsoft',
  'qq',
  'reddit',
  'steam',
  'telegram',
  'twitch',
  'twitter',
  'wechat',
  'weibo',
  'x',
  'yahoo',
];

let activeButton: HTMLElement | null = null;
let tooltip: HTMLElement | null = null;
let pendingTooltip: number | undefined;
let previousDescription: string | null = null;

function getTooltipLabel(button: HTMLElement): string {
  const namedElement = button.querySelector<HTMLElement>('[aria-label], [title], [data-provider], [data-name], img[alt], svg title');
  const label =
    button.getAttribute('aria-label')?.trim() ||
    button.getAttribute('title')?.trim() ||
    button.getAttribute('data-login-tooltip')?.trim() ||
    namedElement?.getAttribute('aria-label')?.trim() ||
    namedElement?.getAttribute('title')?.trim() ||
    namedElement?.getAttribute('data-provider')?.trim() ||
    namedElement?.getAttribute('data-name')?.trim() ||
    namedElement?.getAttribute('alt')?.trim() ||
    namedElement?.textContent?.trim() ||
    button.querySelector('.Button-label, .Button-labelText')?.textContent?.trim() ||
    button.textContent?.trim();

  if (label) return label;

  const classes = [button, ...Array.from(button.querySelectorAll<Element>('[class]'))]
    .map((element) => (element.getAttribute('class') || '').replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase())
    .join(' ');
  const knownProvider = knownProviders.find((name) => new RegExp(`(?:^|[^a-z])${name}(?:$|[^a-z])`, 'i').test(classes));
  if (knownProvider) return knownProvider === 'x' ? 'X' : knownProvider.replace(/\b\w/g, (letter) => letter.toUpperCase());

  const providerClass = Array.from(button.classList).find((name) => /(?:LogInButton|login-button)--/i.test(name));
  const provider = providerClass?.split(/--/).pop()?.replace(/[-_]+/g, ' ');
  return provider ? provider.replace(/\b\w/g, (letter) => letter.toUpperCase()) : '';
}

function getTooltip(): HTMLElement {
  if (tooltip) return tooltip;

  tooltip = document.createElement('div');
  tooltip.id = tooltipId;
  tooltip.className = 'LoginScreenTooltip';
  tooltip.setAttribute('role', 'tooltip');
  tooltip.hidden = true;

  // Popover API 将提示放入浏览器顶层，避免被登录弹窗裁切或遮挡。
  if ('showPopover' in tooltip) tooltip.setAttribute('popover', 'manual');

  document.body.appendChild(tooltip);
  return tooltip;
}

function hideTooltip(): void {
  window.clearTimeout(pendingTooltip);
  pendingTooltip = undefined;

  if (activeButton) {
    if (previousDescription === null) {
      activeButton.removeAttribute('aria-describedby');
    } else {
      activeButton.setAttribute('aria-describedby', previousDescription);
    }
  }

  previousDescription = null;
  activeButton = null;

  if (!tooltip) return;

  const hidePopover = (tooltip as HTMLElement & { hidePopover?: () => void }).hidePopover;
  if (hidePopover && tooltip.matches(':popover-open')) hidePopover.call(tooltip);
  tooltip.hidden = true;
}

function positionTooltip(button: HTMLElement): void {
  if (!tooltip) return;

  const buttonBounds = button.getBoundingClientRect();
  const tooltipBounds = tooltip.getBoundingClientRect();
  const left = Math.max(
    12,
    Math.min(window.innerWidth - tooltipBounds.width - 12, buttonBounds.left + buttonBounds.width / 2 - tooltipBounds.width / 2)
  );
  const above = buttonBounds.top - tooltipBounds.height - 8;
  const top = above >= 8 ? above : Math.min(window.innerHeight - tooltipBounds.height - 8, buttonBounds.bottom + 8);

  tooltip.style.left = `${left}px`;
  tooltip.style.top = `${Math.max(8, top)}px`;
}

function showTooltip(button: HTMLElement): void {
  if (!button.isConnected || activeButton !== button) return;

  const label = getTooltipLabel(button);
  if (!label) {
    hideTooltip();
    return;
  }

  const popup = getTooltip();
  popup.textContent = label;
  popup.hidden = false;
  previousDescription = button.getAttribute('aria-describedby');
  button.setAttribute('aria-describedby', previousDescription ? `${previousDescription} ${tooltipId}` : tooltipId);

  const showPopover = (popup as HTMLElement & { showPopover?: () => void }).showPopover;
  if (showPopover && !popup.matches(':popover-open')) showPopover.call(popup);
  positionTooltip(button);
}

function beginTooltip(button: HTMLElement): void {
  if (activeButton === button) return;
  hideTooltip();

  const label = getTooltipLabel(button);
  if (!label) return;

  if (!button.hasAttribute('aria-label')) button.setAttribute('aria-label', label);
  button.removeAttribute('title');
  activeButton = button;
  const delay = getTooltipDelay(button.closest<HTMLElement>('.LogInModal'));

  pendingTooltip = window.setTimeout(() => showTooltip(button), delay);
}

function findLoginButton(target: EventTarget | null): HTMLElement | null {
  if (!(target instanceof Element)) return null;
  const button = target.closest<HTMLElement>(buttonSelector);
  return button && button.closest('.LogInModal') ? button : null;
}

function markTcsSkinButtons(root: ParentNode): void {
  const buttons =
    root instanceof HTMLElement && root.matches(buttonSelector)
      ? [root, ...Array.from(root.querySelectorAll<HTMLElement>(buttonSelector))]
      : Array.from(root.querySelectorAll<HTMLElement>(buttonSelector));

  buttons.forEach((button) => {
    if (/tcs\s+skin/i.test(getTooltipLabel(button))) {
      button.dataset.loginProvider = 'tcs-skin';
    }
  });
}

/**
 * 读取论坛端序列化的扩展设置。
 *
 * 扩展的 extend() 阶段早于 app.forum 创建，此时直接访问论坛模型会抛出异常并中断整个前端启动，
 * 因此这里先安全地尝试论坛模型，再回退到启动载荷中的论坛资源。
 *
 * @param attribute - 论坛资源上的属性名。
 * @returns 属性值；无法确定时返回 undefined。
 */
function readForumSetting(attribute: string): unknown {
  let value: unknown;

  try {
    value = (app.forum as typeof app.forum | undefined)?.attribute(attribute);
  } catch {
    value = undefined;
  }

  if (value == null) {
    // 初始化器阶段 app.forum 尚未赋值，此时从 store 中取出论坛模型作为第二来源。
    try {
      const stored = app.store?.getById('forums', '1') as { attribute?: (key: string) => unknown } | null | undefined;
      value = stored?.attribute?.(attribute);
    } catch {
      value = undefined;
    }
  }

  if (value == null) {
    const resources = app.data?.resources as unknown as Array<{ type?: string; attributes?: Record<string, unknown> }> | undefined;
    value = resources?.find((resource) => resource.type === 'forums')?.attributes?.[attribute];
  }

  return value ?? undefined;
}

/**
 * 读取容器上由 LESS 输出的 CSS 变量数值，作为设置缺失时的兜底。
 *
 * @param container - 登录按钮容器。
 * @param property - CSS 变量名。
 * @returns 解析出的数值；无法解析时返回 undefined。
 */
function readCssNumber(container: HTMLElement, property: string): number | undefined {
  const value = Number.parseFloat(getComputedStyle(container).getPropertyValue(property));
  return Number.isFinite(value) ? value : undefined;
}

/**
 * 计算登录按钮网格的列数与按钮尺寸。
 *
 * 优先使用论坛端序列化的设置，其次使用 LESS 编译进 CSS 的变量，最后使用默认值。
 *
 * @param container - 登录按钮容器。
 * @returns 列数与按钮尺寸（像素）。
 */
function getLayout(container: HTMLElement): { columns: number; size: number } {
  const configuredColumns = Number(readForumSetting('loginButtonsPerRow'));
  const fallbackColumns = readCssNumber(container, '--login-buttons-per-row') ?? 4;
  const columns = Number.isFinite(configuredColumns) && configuredColumns >= 1 ? configuredColumns : fallbackColumns;

  const configuredSize = Number(readForumSetting('loginButtonSize'));
  const fallbackSize = readCssNumber(container, '--login-button-size') ?? 56;
  const size = Number.isFinite(configuredSize) && configuredSize > 0 ? configuredSize : fallbackSize;

  return {
    columns: Math.max(1, Math.min(4, Math.trunc(columns))),
    size: Math.max(40, Math.min(80, Math.trunc(size))),
  };
}

/**
 * 将按钮网格布局以行内 !important 样式写入容器与按钮。
 *
 * 主题（例如 Concourse）会用 !important 强制 `.LogInButtons` 为纵向 flex，且浏览器可能缓存旧样式表，
 * 因此这里直接以内联 !important 覆盖，确保列数、间距与尺寸与后台设置一致。
 *
 * @param container - 登录按钮容器。
 */
function applyButtonLayout(container: HTMLElement): void {
  const { columns, size } = getLayout(container);
  const items = Array.from(container.children).filter((child): child is HTMLElement => child instanceof HTMLElement);
  if (items.length === 0) return;

  const gap = 8;
  // 窄屏时按可用宽度收敛列数，避免按钮溢出弹窗。
  // 为手机端浏览器做适配，如后续出现问题再修改，因为没有测试环境，只能给浏览器窗口收窄当测试。
  const available = container.parentElement?.clientWidth || window.innerWidth;
  const fittingColumns = Math.max(1, Math.floor((available + gap) / (size + gap)));
  const effectiveColumns = Math.min(columns, fittingColumns);

  const containerStyles: Record<string, string> = {
    display: 'grid',
    'grid-template-columns': `repeat(${effectiveColumns}, ${size}px)`,
    'grid-auto-flow': 'row',
    'justify-content': 'center',
    'justify-items': 'center',
    gap: `${gap}px`,
    width: 'max-content',
    'max-width': 'calc(100vw - 48px)',
    margin: '0 auto 18px',
  };

  Object.entries(containerStyles).forEach(([property, value]) => container.style.setProperty(property, value, 'important'));
  container.style.setProperty('--login-buttons-per-row', String(effectiveColumns));
  container.style.setProperty('--login-button-size', `${size}px`);

  const hasSingleFinalItem = items.length > effectiveColumns && items.length % effectiveColumns === 1;

  items.forEach((item, index) => {
    item.style.setProperty('display', 'flex', 'important');
    item.style.setProperty('align-items', 'center', 'important');
    item.style.setProperty('justify-content', 'center', 'important');
    item.style.setProperty('margin', '0', 'important');
    item.style.setProperty('box-sizing', 'border-box', 'important');
    ['width', 'min-width', 'max-width', 'height', 'min-height', 'max-height'].forEach((property) =>
      item.style.setProperty(property, `${size}px`, 'important')
    );

    const isLastItem = index === items.length - 1;
    item.style.setProperty('grid-column', hasSingleFinalItem && isLastItem ? '1 / -1' : 'auto');
    item.style.setProperty('justify-self', 'center');
    item.classList.toggle('LoginButtons-single-final-item', hasSingleFinalItem && isLastItem);

    // 包装层（如 FoF/OAuth 的 LogInButtonContainer）内部的真实按钮同样需要固定尺寸，
    // 否则主题的 width: 100% 会把按钮撑破网格。
    if (!item.matches('.LogInButton, button, a, [role="button"]')) {
      item.querySelectorAll<HTMLElement>('.LogInButton, button, a, [role="button"]').forEach((button) => {
        ['width', 'min-width', 'max-width', 'height', 'min-height', 'max-height'].forEach((property) =>
          button.style.setProperty(property, `${size}px`, 'important')
        );
        button.style.setProperty('margin', '0', 'important');
        button.style.setProperty('padding', '10px', 'important');
        button.style.setProperty('box-sizing', 'border-box', 'important');
      });
    }
  });
}

function updateLoginButtonLayouts(root: ParentNode): void {
  const containers =
    root instanceof HTMLElement && root.matches('.LogInModal .LogInButtons')
      ? [root, ...Array.from(root.querySelectorAll<HTMLElement>('.LogInModal .LogInButtons'))]
      : Array.from(root.querySelectorAll<HTMLElement>('.LogInModal .LogInButtons'));

  containers.forEach(applyButtonLayout);
}

/**
 * 解析提示显示的延迟时间（毫秒）。
 *
 * @param modal - 登录弹窗元素，用于读取 LESS 输出的 CSS 变量。
 * @returns 0–2000 之间的毫秒数。
 */
function getTooltipDelay(modal: HTMLElement | null): number {
  const configured = Number(readForumSetting('loginButtonTooltipDelay'));
  if (Number.isFinite(configured) && configured >= 0) return Math.min(2000, configured);

  const cssValue = modal ? readCssNumber(modal, '--login-button-tooltip-delay') : undefined;
  return Math.min(2000, Math.max(0, cssValue ?? 500));
}

/**
 * 初始化登录界面的提示与按钮布局增强。
 *
 * 该函数在 app 初始化器阶段执行，避免在 extend() 阶段访问尚未创建的 app.forum。
 */
function setupLoginScreen(): void {
  markTcsSkinButtons(document);
  updateLoginButtonLayouts(document);

  // 登录扩展可能在页面初始化后动态插入，及时识别其按钮以应用专属图标对齐。
  new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (!(node instanceof Element)) return;

        const isLoginNode =
          node.matches(buttonSelector) ||
          node.matches('.LogInButtons') ||
          node.querySelector(buttonSelector) !== null ||
          node.querySelector('.LogInButtons') !== null;
        if (!isLoginNode) return;

        const modal = node.closest('.LogInModal');
        if (!modal) return;

        markTcsSkinButtons(modal);
        updateLoginButtonLayouts(modal);
      });
    });
  }).observe(document.body, { childList: true, subtree: true });

  document.addEventListener('pointerover', (event) => {
    const button = findLoginButton(event.target);
    if (!button || (event.relatedTarget instanceof Node && button.contains(event.relatedTarget))) return;
    beginTooltip(button);
  });

  document.addEventListener('pointerout', (event) => {
    const button = findLoginButton(event.target);
    if (button && !(event.relatedTarget instanceof Node && button.contains(event.relatedTarget)) && activeButton === button) hideTooltip();
  });

  document.addEventListener('focusin', (event) => {
    const button = findLoginButton(event.target);
    if (button) beginTooltip(button);
  });

  document.addEventListener('focusout', (event) => {
    const button = findLoginButton(event.target);
    if (button && activeButton === button) hideTooltip();
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') hideTooltip();
  });

  document.addEventListener('scroll', hideTooltip, true);
  window.addEventListener('resize', hideTooltip);

  // 视口变化会影响可用宽度，需要重新按宽度收敛列数。
  let resizeTimer: number | undefined;
  window.addEventListener('resize', () => {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(() => updateLoginButtonLayouts(document), 150);
  });
}

const tooltipExtender: IExtender = {
  extend() {
    /**
     * 初始化器在 app 启动时执行；此时 DOM 已就绪，而 app.forum 可能仍在创建中，
     * 因此读取设置统一走 readForumSetting() 的多级安全回退。
     */
    app.initializers.add('tacraft-social-guild-login-screen', () => {
      try {
        setupLoginScreen();
      } catch (error) {
        // 增强逻辑失败不应中断论坛启动。
        console.error('[flarum-login-screen] 登录界面增强初始化失败', error);
      }
    });
  },
};

export default [...commonExtend, tooltipExtender];
