'use client';

export function Disclaimer() {
  return (
    <div className="mt-8 text-sm text-muted-foreground border-t pt-4">
      <p className="mb-2">
        <strong>Disclaimer:</strong> 투자에는 항상 리스크가 따라옵니다.
      </p>
      <p className="mb-2">
        본 대시보드는 투자 결정을 위한 참고 자료로만 활용되어야 하며, 데이터가
        정확하지 않을 수 있습니다. 투자 결정의 최종 책임은 사용자 본인에게
        있습니다.
      </p>
      <p>
        과거의 데이터가 미래의 수익을 보장하지 않으며, 투자 결과에 대한 어떠한
        법적 책임도 지지 않습니다. 투자 전 반드시 전문가와 상담하시기 바랍니다.
      </p>
    </div>
  );
}
