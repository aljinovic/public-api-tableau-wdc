let $communityMetrics = $('#communityMetrics')
let $communityMetricsContent = $('#communityMetricsContent')
let $communityMetricsSpinner = $('#communityMetricsSpinner').hide()

$(function () {
    $communityMetrics.submit(onCommunityMetricsSubmit)
})

async function onCommunityMetricsSubmit(e) {
    e.preventDefault()
    $communityMetricsSpinner.show()

    SBKS.community_metrics = []
    SBKS.community_dimensions = []
    SBKS.time_dimension = null

    let post_fields = {}
    for (const item of $communityMetrics.serializeArray()) {
        if (['', undefined, null].includes(item.value)) {
            continue
        }

        if (item.name === 'daterange') {
            SBKS.date_range = parseDateRange(item.value)
            continue
        }

        post_fields = processFormField(post_fields, item)
    }

    for (const [k, v] of Object.entries(post_fields)) {
        SBKS[k] = v
    }

    tableau.connectionData = JSON.stringify(SBKS)
    invokeConnector(SBKS.data_source)
}

function renderCommunityMetrics() {
    $communityMetricsContent.html(`        
        <div class="input-group mb-3">
            <label class="input-group-text">Metrics</label>
            <select class="form-select" data-type="community_metrics" name="community_metrics[]"></select>
        </div>
        <div class="input-group mb-3">
            <label class="input-group-text">Dimensions</label>
            <select class="form-select" data-type="community_dimensions" name="community_dimensions[]"></select>
        </div>
    `)

    $communityMetrics.show()

    initCommunityMetricsAndDimensions()
}

function initCommunityMetricsAndDimensions() {
    // Fix the positioning bug with select2
    $('select').each(function () {
        if ($(this).outerWidth() > 10) {
            $(this).css({width: `${$(this).outerWidth() - 1}px`})
        }
    })

    $('#community_metrics_profile_labels').select2({
        multiple: true,
        data: SBKS.profile_labels.map(label => {
            return {id: label.id, text: label.name}
        })
    })

    $('#community_metrics_post_labels').select2({
        multiple: true,
        data: SBKS.post_labels.map(label => {
            return {id: label.id, text: label.name}
        })
    })

    $('select[data-type=community_metrics]').each(function () {
        $(this).empty().select2({multiple: true, data: Object.keys(COMMUNITY_METRICS)})
    }).change(function () {
        let self = $(this)
        let dimensions = []

        for (const metric of self.val()) {
            dimensions = !dimensions.length
                ? COMMUNITY_METRICS[metric]
                : intersect(dimensions, COMMUNITY_METRICS[metric])
        }

        let $dimensionsSelect = $(`select[data-type=community_dimensions]`)
        let value = $dimensionsSelect.val()
        $dimensionsSelect.empty().select2({
            multiple: true,
            data: dimensions.map(v => {
                return {id: v, text: v}
            })
        }).val(value && value.length ? value : ['profile']).trigger('change')
    }).trigger('change')
}