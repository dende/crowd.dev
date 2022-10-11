export default (filter) => {
  return {
    [filter.operator]: Object.values(
      filter.attributes
    ).reduce((acc, item) => {
      if (
        Array.isArray(item.value)
          ? item.value.length > 0
          : item.value !== '' || item.value !== null
      ) {
        acc.push(_buildAttributeBlock(item))
      }

      return acc
    }, [])
  }
}

function _buildAttributeBlock(attribute) {
  let rule = {}

  if (attribute.name === 'score') {
    return {
      or: [
        attribute.value.map((option) => {
          return {
            score: {
              between: option.value
            }
          }
        })
      ]
    }
  } else if (attribute.operator === 'between') {
    rule = {
      between: attribute.value
    }
  } else if (attribute.operator === null) {
    rule = Array.isArray(attribute.value)
      ? attribute.value.map((o) => o.id || o.value)
      : attribute.value
  } else {
    rule = {
      [attribute.operator]: Array.isArray(attribute.value)
        ? attribute.value.map((o) => o.id || o.value)
        : attribute.value
    }
  }

  return {
    [attribute.custom
      ? `attributes.${attribute.name}.default`
      : attribute.name]: rule
  }
}
