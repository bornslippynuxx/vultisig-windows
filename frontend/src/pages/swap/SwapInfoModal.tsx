import { Trans, useTranslation } from 'react-i18next';

import Accordion from '../../components/common/accordion';
import ModalBase from '../../components/common/modal';

type SwapInfoModalProps = {
  open: boolean;
  onClose: () => void;
};

export default function SwapInfoModal({ onClose, open }: SwapInfoModalProps) {
  const { t } = useTranslation();
  return (
    <ModalBase onClose={onClose} open={open} title="Swap Info" subtitle="">
      <div
        style={{
          maxWidth: 600,
        }}
        className="mb-[12px]"
      >
        <p className="text-[18px] mt-[8px] font-bold">
          <Trans t={t}>page.swap.info.title</Trans>
        </p>
        <span className="text-[12px] text-neutral-300 font-medium">
          Asset swapping is a straightforward yet powerful tool for exchanging
          one cryptocurrency for another. This process is akin to currency
          exchange in the traditional finance world, but it operates within the
          digital currency space.
        </span>
        <div className="mt-[12px]">
          <Accordion
            title="page.swap.info.how.it.work"
            buttonClassName="ml-[-12px]"
          >
            <div>
              <p className="text-[12px] font-bold">
                <Trans t={t}>page.swap.info.select.assets</Trans>
              </p>
              <span className="text-[12px] text-neutral-300 font-medium">
                <Trans t={t}>page.swap.info.select.assets.description</Trans>
              </span>
            </div>
            <div className="mt-[12px]">
              <p className="text-[12px] font-bold">
                <Trans t={t}>page.swap.info.check.rates</Trans>
              </p>
              <span className="text-[12px] text-neutral-300 font-medium">
                <Trans t={t}>page.swap.info.check.rates.description</Trans>
              </span>
            </div>
            <div className="mt-[12px]">
              <p className="text-[12px] font-bold">
                <Trans t={t}>page.swap.info.confirm.swap</Trans>
              </p>
              <span className="text-[12px] text-neutral-300 font-medium">
                <Trans t={t}>page.swap.info.confirm.swap.description</Trans>
              </span>
            </div>
            <div className="mt-[12px]">
              <p className="text-[12px] font-bold">
                <Trans t={t}>page.swap.info.receive.assets</Trans>
              </p>
              <span className="text-[12px] text-neutral-300 font-medium">
                <Trans t={t}>page.swap.info.receive.assets.description</Trans>
              </span>
            </div>
          </Accordion>
          <Accordion
            title="page.swap.info.swap.benefits.title"
            buttonClassName="ml-[-12px]"
          >
            <div>
              <p className="text-[12px] font-bold">
                <Trans t={t}>page.swap.info.swap.benefits.decentralised</Trans>
              </p>
              <span className="text-[12px] text-neutral-300 font-medium">
                <Trans t={t}>
                  page.swap.info.swap.benefits.decentralised.description
                </Trans>
              </span>
            </div>
            <div className="mt-[12px]">
              <p className="text-[12px] font-bold">
                <Trans t={t}>page.swap.info.swap.benefits.speed</Trans>
              </p>
              <span className="text-[12px] text-neutral-300 font-medium">
                <Trans t={t}>
                  page.swap.info.swap.benefits.speed.description
                </Trans>
              </span>
            </div>
            <div className="mt-[12px]">
              <p className="text-[12px] font-bold">
                <Trans t={t}>page.swap.info.swap.benefits.accessibility</Trans>
              </p>
              <span className="text-[12px] text-neutral-300 font-medium">
                <Trans t={t}>
                  page.swap.info.swap.benefits.accessibility.description
                </Trans>
              </span>
            </div>
            <div className="mt-[12px]">
              <p className="text-[12px] font-bold">
                <Trans t={t}>page.swap.info.swap.benefits.liquidity</Trans>
              </p>
              <span className="text-[12px] text-neutral-300 font-medium">
                <Trans t={t}>
                  page.swap.info.swap.benefits.liquidity.description
                </Trans>
              </span>
            </div>
          </Accordion>
          <Accordion title="page.swap.info.tips" buttonClassName="ml-[-12px]">
            <div>
              <p className="text-[12px] font-bold">
                <Trans t={t}>page.swap.info.tips.start</Trans>
              </p>
              <span className="text-[12px] text-neutral-300 font-medium">
                <Trans t={t}>page.swap.info.tips.start.description</Trans>
              </span>
            </div>
            <div className="mt-[12px]">
              <p className="text-[12px] font-bold">
                <Trans t={t}>page.swap.info.tips.stay.informed</Trans>
              </p>
              <span className="text-[12px] text-neutral-300 font-medium">
                <Trans t={t}>
                  page.swap.info.tips.stay.informed.description
                </Trans>
              </span>
            </div>
            <div className="mt-[12px]">
              <p className="text-[12px] font-bold">
                <Trans t={t}>page.swap.info.tips.security</Trans>
              </p>
              <span className="text-[12px] text-neutral-300 font-medium">
                <Trans t={t}>page.swap.info.tips.security.description</Trans>
              </span>
            </div>
          </Accordion>
        </div>
      </div>
    </ModalBase>
  );
}
