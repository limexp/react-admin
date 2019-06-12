import React, {
    Fragment,
    isValidElement,
    cloneElement,
    useState,
    useEffect,
} from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import { useDispatch } from 'react-redux';
import { push } from 'connected-react-router';
import TableCell from '@material-ui/core/TableCell';
import TableRow from '@material-ui/core/TableRow';
import Checkbox from '@material-ui/core/Checkbox';
import { linkToRecord } from 'ra-core';

import DatagridCell from './DatagridCell';
import ExpandRowButton from './ExpandRowButton';

const computeNbColumns = (expand, children, hasBulkActions) =>
    expand
        ? 1 + // show expand button
          (hasBulkActions ? 1 : 0) + // checkbox column
          React.Children.toArray(children).filter(child => !!child).length // non-null children
        : 0; // we don't need to compute columns if there is no expand panel;

const defaultClasses = {};

const DatagridRow = ({
    basePath,
    children,
    classes = defaultClasses,
    className,
    expand,
    hasBulkActions,
    hover,
    id,
    onToggleItem,
    record,
    resource,
    rowClick,
    selected,
    style,
    ...rest
}) => {
    const [expanded, setExpanded] = useState(false);
    const [nbColumns, setNbColumns] = useState(
        computeNbColumns(expand, children, hasBulkActions)
    );
    useEffect(() => {
        // Fields can be hidden dynamically based on permissions;
        // The expand panel must span over the remaining columns
        // So we must recompute the number of columns to span on
        const newNbColumns = computeNbColumns(expand, children, hasBulkActions);
        if (newNbColumns !== nbColumns) {
            setNbColumns(newNbColumns);
        }
    }, [expand, nbColumns, children, hasBulkActions]);
    const dispatch = useDispatch();

    const handleToggleExpand = event => {
        setExpanded(!expanded);
        event.stopPropagation();
    };
    const handleToggleSelection = event => {
        onToggleItem(id);
        event.stopPropagation();
    };
    const handleClick = async event => {
        if (!rowClick) return;
        const effect =
            typeof rowClick === 'function'
                ? await rowClick(id, basePath, record)
                : rowClick;
        switch (effect) {
            case 'edit':
                dispatch(push(linkToRecord(basePath, id)));
                return;
            case 'show':
                dispatch(push(linkToRecord(basePath, id, 'show')));
                return;
            case 'expand':
                handleToggleExpand(event);
                return;
            case 'toggleSelection':
                handleToggleSelection(event);
                return;
            default:
                if (effect) dispatch(push(effect));
                return;
        }
    };

    return (
        <Fragment>
            <TableRow
                className={className}
                key={id}
                style={style}
                hover={hover}
                onClick={handleClick}
                {...rest}
            >
                {expand && (
                    <TableCell
                        padding="none"
                        className={classes.expandIconCell}
                    >
                        <ExpandRowButton
                            classes={classes}
                            expanded={expanded}
                            onClick={handleToggleExpand}
                            expandContentId={`${id}-expand`}
                        />
                    </TableCell>
                )}
                {hasBulkActions && (
                    <TableCell padding="none">
                        <Checkbox
                            color="primary"
                            className={`select-item ${classes.checkbox}`}
                            checked={selected}
                            onClick={handleToggleSelection}
                        />
                    </TableCell>
                )}
                {React.Children.map(children, (field, index) =>
                    isValidElement(field) ? (
                        <DatagridCell
                            key={`${id}-${field.props.source || index}`}
                            className={classnames(
                                `column-${field.props.source}`,
                                classes.rowCell
                            )}
                            record={record}
                            {...{ field, basePath, resource }}
                        />
                    ) : null
                )}
            </TableRow>
            {expand && expanded && (
                <TableRow key={`${id}-expand`} id={`${id}-expand`}>
                    <TableCell colSpan={nbColumns}>
                        {cloneElement(expand, {
                            record,
                            basePath,
                            resource,
                            id: String(id),
                        })}
                    </TableCell>
                </TableRow>
            )}
        </Fragment>
    );
};

DatagridRow.propTypes = {
    basePath: PropTypes.string,
    children: PropTypes.node,
    classes: PropTypes.object,
    className: PropTypes.string,
    expand: PropTypes.element,
    hasBulkActions: PropTypes.bool.isRequired,
    hover: PropTypes.bool,
    id: PropTypes.any,
    onToggleItem: PropTypes.func,
    record: PropTypes.object.isRequired,
    resource: PropTypes.string,
    rowClick: PropTypes.oneOfType([PropTypes.string, PropTypes.func]),
    selected: PropTypes.bool,
    style: PropTypes.object,
};

DatagridRow.defaultProps = {
    hasBulkActions: false,
    hover: true,
    record: {},
    selected: false,
};

// wat? TypeScript looses the displayName if we don't set it explicitly
DatagridRow.displayName = 'DatagridRow';

export default DatagridRow;
