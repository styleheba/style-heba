export const metadata = {
  title: 'Shipping Policy',
};

export default function ShippingPolicyPage() {
  return (
    <div className="container-app py-12 max-w-3xl">
      <h1 className="text-3xl font-bold text-slate-900 mb-8">Shipping Policy</h1>

      <div className="prose prose-slate max-w-none space-y-8">
        <section>
          <h2 className="text-xl font-bold text-slate-800">배송비 안내</h2>
          <p className="text-slate-600 leading-relaxed">
            • $150 이상 주문 시 무료배송<br />
            • $150 미만 주문 시 $10 배송비 부과<br />
            • 픽업 (Atlanta, GA) 선택 시 배송비 무료
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-800">배송 지역</h2>
          <p className="text-slate-600 leading-relaxed">
            미국 내 전 지역 배송 가능합니다. 현재 해외 배송은 지원하지 않습니다.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-800">배송 기간</h2>
          <p className="text-slate-600 leading-relaxed">
            • 프리오더 공구: 한국 발주 후 약 2~3주 소요<br />
            • 바로구매: 입금 확인 후 3~5일 이내 발송<br />
            • 배송 시작 시 이메일로 안내드립니다
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-800">픽업 안내</h2>
          <p className="text-slate-600 leading-relaxed">
            Atlanta, GA 지역 픽업이 가능합니다. 픽업 장소와 시간은 입금 확인 후 별도 안내드립니다.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-800">교환 및 반품</h2>
          <p className="text-slate-600 leading-relaxed">
            • 상품 수령 후 7일 이내 교환/반품 가능<br />
            • 단순 변심에 의한 반품 시 반품 배송비는 고객 부담<br />
            • 상품 불량 또는 오배송 시 무료 교환/반품<br />
            • 교환/반품 문의: jamie@styleheba.com
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-800">문의</h2>
          <p className="text-slate-600 leading-relaxed">
            배송 관련 문의사항은 아래로 연락해주세요.<br />
            이메일: jamie@styleheba.com<br />
            Instagram: @styleheba
          </p>
        </section>
      </div>
    </div>
  );
}