package com.xxzd.study.domain;

import java.util.ArrayList;
import java.util.List;

/**
 * D3 层次结构节点，用于 Radial Cluster 可视化
 */
public class HierarchyNode {

    private String name;
    private Integer value;
    private List<HierarchyNode> children;

    public HierarchyNode() {
    }

    public HierarchyNode(String name) {
        this.name = name;
    }

    public HierarchyNode(String name, Integer value) {
        this.name = name;
        this.value = value;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public Integer getValue() {
        return value;
    }

    public void setValue(Integer value) {
        this.value = value;
    }

    public List<HierarchyNode> getChildren() {
        return children;
    }

    public void setChildren(List<HierarchyNode> children) {
        this.children = children;
    }

    public void addChild(HierarchyNode child) {
        if (this.children == null) {
            this.children = new ArrayList<>();
        }
        this.children.add(child);
    }
}
