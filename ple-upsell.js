// Remove these import statements as they are unnecessary
// import { response } from "express";
// import { get } from "http";

(async function () {
    document.addEventListener('DOMContentLoaded', async function () {
        function getErrorString(error) {
            return `&error=${error}%20Please%20email%20suport@davidbayer.com%20or%20call%20407-537-4538%20for%20assistance.`;
        }

        const urlParams = new URLSearchParams(window.location.search);
        const keapOrderId = urlParams.get('orderId');
        const isFromKeap = keapOrderId && keapOrderId !== '' && keapOrderId !== '0';
        const firstName = urlParams.get('inf_field_FirstName') || '';
        const lastName = urlParams.get('inf_field_LastName') || '';
        const email = urlParams.get('inf_field_Email') || '';
        let phone = urlParams.get('inf_field_Phone1') || '';
        const contactId = urlParams.get('inf_field_ContactId') || '';
        const surveyRedirect = `https://davidbayercoaching.com/ss-survey?inf_field_FirstName=${firstName}&inf_field_LastName=${lastName}&inf_field_Email=${email}&inf_field_Phone1=${phone}&inf_field_ContactId=${contactId}`;
        if (isFromKeap) {
            try {
                const requestObject = {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        apiName: "KEAP",
                        endpoint: `/orders/${keapOrderId}`,
                        method: "GET"
                    })
                };

                const orderResponse = await fetch(`https://http-nodejs-production-5fbc.up.railway.app/proxy?apiName=KEAP&endpoint=/orders/${keapOrderId}`, requestObject);
                const data = await orderResponse.json();

                const contactId = data.contact.id;

                try {
                    const contactRequestObject = {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json"
                        },
                        body: JSON.stringify({
                            apiName: "KEAP",
                            endpoint: `/v1/contacts/${contactId}`,
                            method: "GET"
                        })
                    };

                    const contactResponse = await fetch('https://http-nodejs-production-5fbc.up.railway.app/proxy', contactRequestObject);
                    const contactData = await contactResponse.json();

                    phone = contactData.phone_numbers[0].number;
                }
                catch (error) {
                    console.error('Error fetching contact data:', error);
                }

                const today = new Date();
                const currentUrl = window.location.href;
                const ccId = data.payment_plan.credit_card_id;
                const upsellButtons = document.querySelectorAll(`img[data-imagelink*="#yes-link"]`);

                upsellButtons.forEach(button => {
                    button.addEventListener('click', async function (event) {
                        event.preventDefault();

                        try {
                            const upsellRequestObject = {
                                method: "POST",
                                headers: {
                                    "Content-Type": "application/json"
                                },
                                body: JSON.stringify({
                                    apiName: "KEAP",
                                    endpoint: `/v1/orders`,
                                    method: "POST",
                                    data: {
                                        contact_id: contactId,
                                        order_date: today.toISOString(),
                                        order_items: [
                                            {
                                                product_id: 47,
                                                quantity: 1,
                                            }
                                        ],
                                        order_title: 'PLE Comp Ticket',
                                        order_type: 'Online'
                                    }
                                })
                            };

                            const upsellResponse = await fetch('https://http-nodejs-production-5fbc.up.railway.app/proxy', upsellRequestObject);
                            const upsellData = await upsellResponse.json();

                            const upsellOrderId = upsellData.id;

                            const paymentRequestObject = {
                                method: "POST",
                                headers: {
                                    "Content-Type": "application/json"
                                },
                                body: JSON.stringify({
                                    apiName: "KEAP",
                                    endpoint: `/v1/orders/${upsellOrderId}/payments`,
                                    method: "POST",
                                    data: {
                                        credit_card_id: ccId,
                                        payment_amount: upsellData.total_due,
                                        charge_now: true,
                                        payment_method_type: 'CREDIT_CARD',
                                        payment_gateway_id: 8
                                    }
                                })
                            };

                            const paymentObj = await fetch('https://http-nodejs-production-5fbc.up.railway.app/proxy', paymentRequestObject);
                            const paymentData = await paymentObj.json();

                            window.location.href = surveyRedirect + getErrorString(paymentData.payment_status + '.');

                        } catch (error) {
                            console.error('Error during upsell or payment process:', error);
                            window.location.href = surveyRedirect + getErrorString('Error%20processing%20payment');
                        }
                    });
                });
            } catch (error) {
                console.error('Error fetching order or contact data:', error);
                window.location.href = surveyRedirect + getErrorString('Error%20fetching%20order%20data');
            }
        }
    });
})();