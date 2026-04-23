from flask import Flask, request, jsonify
from margin_engine import MarginEngine, BuyerProfile, ListingInput, SourceType

app = Flask(__name__)

@app.route('/api/deal/evaluate', methods=['POST'])
def evaluate_deal():
    data = request.json
    
    buyer_profile = BuyerProfile(
        buy_roi_min=data.get('roiThresholdBuy', 0.20),
        negotiate_roi_min=data.get('roiThresholdNegotiate', 0.08),
        transport_rate=data.get('transportRate', 4.50),
        transport_minimum=data.get('transportMinimum', 350.0),
        max_negotiation_rounds=data.get('maxNegotiationRounds', 3),
        target_margin_floor=data.get('targetMarginFloor', 0.05),
    )
    
    listing = ListingInput(
        listing_id=data.get('listingId', 'test-001'),
        asking_price=data.get('listingPrice'),
        category=data.get('equipmentType', 'excavator'),
        hours=data.get('hours'),
        condition=data.get('condition', 'unknown'),
        operable=data.get('operable', True),
        source=SourceType.UNKNOWN,
        distance_miles=data.get('transportMiles', 500),
        is_auction=data.get('isAuction', False),
        market_p50=data.get('marketValue'),
        market_p90=data.get('marketValueHigh'),
        repair_estimate=data.get('repairEstimate'),
        resale_value=data.get('resaleValue'),
    )
    
    engine = MarginEngine(profile=buyer_profile)
    result = engine.evaluate(listing)
    
    return jsonify({
        'decision': result.decision.value,
        'asking_price': result.asking_price,
        'fair_value': result.fair_value,
        'roi_at_ask': round(result.roi_at_ask, 4) if result.roi_at_ask else None,
        'final_roi': round(result.final_roi, 4) if result.final_roi else None,
        'final_offer': result.final_offer,
        'rationale': result.rationale,
        'flags': result.flags,
        'confidence': round(result.confidence, 4),
    })

if __name__ == '__main__':
    app.run(port=5000, debug=True)
