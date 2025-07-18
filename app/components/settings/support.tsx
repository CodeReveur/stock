"use client";

const Support= () => {

  return (
    <div className="p-5 bg-neutral-900 rounded-lg h-max">
       
      <div className="flex justify-between items-center">
        <h4 className="text-neutral-400 text-lg">Support</h4>
      </div>
      <div className="p-2">
        <div className="text-neutral-500 my-1">
          Kamero Stock Management is ready to help at any cost. Note that our support is active 24/7. <br />
          If you have faced and issue of usage and another bugs, please let us know or visit FAQs page 
          <a href="https://ksm.kamero.rw/help/faqs" className="text-emerald-700"> https://ksm.kamero.rw/help/faqs</a>. <br />
          For system error contact us directly to <a href="mailto:codereveur@gmail.com" className="text-emerald-700">codereveur@gmail.com</a> or
          call us on <a href="tel:+250781121117" className="text-emerald-700">+250 781 121 117</a>
          <br />For more info visit <a href="https://ksm.kamero.rw" className="text-emerald-700">https://ksm.kamero.rw</a>
        </div>
      </div>
    </div>
  );
}
export default  Support;