/********************************************************************************
** Form generated from reading UI file 'transactionframe.ui'
**
** Created by: Qt User Interface Compiler version 5.15.16
**
** WARNING! All changes made in this file will be lost when recompiling UI file!
********************************************************************************/

#ifndef UI_TRANSACTIONFRAME_H
#define UI_TRANSACTIONFRAME_H

#include <QtCore/QVariant>
#include <QtWidgets/QApplication>
#include <QtWidgets/QFrame>
#include <QtWidgets/QGridLayout>
#include <QtWidgets/QLabel>

QT_BEGIN_NAMESPACE

class Ui_TransactionFrame
{
public:
    QGridLayout *gridLayout;
    QLabel *m_iconLabel;
    QLabel *o_amountLabel;
    QLabel *m_timeLabel;
    QLabel *m_confirmationsLabel;
    QLabel *m_txLabel;
    QLabel *m_starkStatusLabel;

    void setupUi(QFrame *TransactionFrame)
    {
        if (TransactionFrame->objectName().isEmpty())
            TransactionFrame->setObjectName(QString::fromUtf8("TransactionFrame"));
        TransactionFrame->resize(441, 61);
        TransactionFrame->setMinimumSize(QSize(311, 61));
        TransactionFrame->setMaximumSize(QSize(16777215, 61));
        TransactionFrame->setAutoFillBackground(true);
        TransactionFrame->setStyleSheet(QString::fromUtf8("color: #ddd; \n"
""));
        TransactionFrame->setFrameShape(QFrame::NoFrame);
        TransactionFrame->setFrameShadow(QFrame::Raised);
        gridLayout = new QGridLayout(TransactionFrame);
        gridLayout->setObjectName(QString::fromUtf8("gridLayout"));
        gridLayout->setContentsMargins(0, 0, 0, 4);
        m_iconLabel = new QLabel(TransactionFrame);
        m_iconLabel->setObjectName(QString::fromUtf8("m_iconLabel"));
        QSizePolicy sizePolicy(QSizePolicy::Preferred, QSizePolicy::Preferred);
        sizePolicy.setHorizontalStretch(0);
        sizePolicy.setVerticalStretch(0);
        sizePolicy.setHeightForWidth(m_iconLabel->sizePolicy().hasHeightForWidth());
        m_iconLabel->setSizePolicy(sizePolicy);
        m_iconLabel->setMinimumSize(QSize(0, 21));
        m_iconLabel->setMaximumSize(QSize(125, 21));
        QFont font;
        font.setFamily(QString::fromUtf8("Poppins"));
        font.setPointSize(8);
        m_iconLabel->setFont(font);
        m_iconLabel->setStyleSheet(QString::fromUtf8("color: #ddd; \n"
"border-bottom: none;"));
        m_iconLabel->setAlignment(Qt::AlignLeading|Qt::AlignLeft|Qt::AlignVCenter);

        gridLayout->addWidget(m_iconLabel, 0, 0, 1, 1);

        o_amountLabel = new QLabel(TransactionFrame);
        o_amountLabel->setObjectName(QString::fromUtf8("o_amountLabel"));
        QSizePolicy sizePolicy1(QSizePolicy::Expanding, QSizePolicy::Preferred);
        sizePolicy1.setHorizontalStretch(0);
        sizePolicy1.setVerticalStretch(0);
        sizePolicy1.setHeightForWidth(o_amountLabel->sizePolicy().hasHeightForWidth());
        o_amountLabel->setSizePolicy(sizePolicy1);
        o_amountLabel->setMinimumSize(QSize(0, 21));
        o_amountLabel->setMaximumSize(QSize(16777215, 21));
        o_amountLabel->setFont(font);
        o_amountLabel->setStyleSheet(QString::fromUtf8("color: orange; \n"
"border-bottom: none;"));
        o_amountLabel->setAlignment(Qt::AlignRight|Qt::AlignTrailing|Qt::AlignVCenter);

        gridLayout->addWidget(o_amountLabel, 0, 2, 1, 1);

        m_timeLabel = new QLabel(TransactionFrame);
        m_timeLabel->setObjectName(QString::fromUtf8("m_timeLabel"));
        sizePolicy1.setHeightForWidth(m_timeLabel->sizePolicy().hasHeightForWidth());
        m_timeLabel->setSizePolicy(sizePolicy1);
        m_timeLabel->setMinimumSize(QSize(0, 21));
        m_timeLabel->setMaximumSize(QSize(16777215, 21));
        m_timeLabel->setFont(font);
        m_timeLabel->setStyleSheet(QString::fromUtf8("color: #999; \n"
"border-bottom: none;"));

        gridLayout->addWidget(m_timeLabel, 0, 1, 1, 1);

        m_confirmationsLabel = new QLabel(TransactionFrame);
        m_confirmationsLabel->setObjectName(QString::fromUtf8("m_confirmationsLabel"));
        m_confirmationsLabel->setMinimumSize(QSize(0, 21));
        m_confirmationsLabel->setMaximumSize(QSize(16777215, 18));
        m_confirmationsLabel->setFont(font);
        m_confirmationsLabel->setStyleSheet(QString::fromUtf8("color: #999; \n"
"border-bottom: none;"));

        gridLayout->addWidget(m_confirmationsLabel, 1, 0, 1, 1);

        m_txLabel = new QLabel(TransactionFrame);
        m_txLabel->setObjectName(QString::fromUtf8("m_txLabel"));
        m_txLabel->setMinimumSize(QSize(0, 21));
        m_txLabel->setMaximumSize(QSize(16777215, 21));
        m_txLabel->setFont(font);
        m_txLabel->setStyleSheet(QString::fromUtf8("color: #999; \n"
"border-bottom: none;"));
        m_txLabel->setAlignment(Qt::AlignRight|Qt::AlignTrailing|Qt::AlignVCenter);

        gridLayout->addWidget(m_txLabel, 1, 1, 1, 1);

        m_starkStatusLabel = new QLabel(TransactionFrame);
        m_starkStatusLabel->setObjectName(QString::fromUtf8("m_starkStatusLabel"));
        m_starkStatusLabel->setMinimumSize(QSize(80, 21));
        m_starkStatusLabel->setMaximumSize(QSize(80, 21));
        QFont font1;
        font1.setFamily(QString::fromUtf8("Poppins"));
        font1.setPointSize(7);
        m_starkStatusLabel->setFont(font1);
        m_starkStatusLabel->setStyleSheet(QString::fromUtf8("color: #999; \n"
"border-bottom: none;\n"
"padding: 2px 4px;\n"
"border-radius: 3px;"));
        m_starkStatusLabel->setAlignment(Qt::AlignCenter|Qt::AlignVCenter);

        gridLayout->addWidget(m_starkStatusLabel, 1, 2, 1, 1);


        retranslateUi(TransactionFrame);

        QMetaObject::connectSlotsByName(TransactionFrame);
    } // setupUi

    void retranslateUi(QFrame *TransactionFrame)
    {
        TransactionFrame->setWindowTitle(QCoreApplication::translate("TransactionFrame", "Frame", nullptr));
        m_iconLabel->setText(QString());
        o_amountLabel->setText(QCoreApplication::translate("TransactionFrame", "TextLabel", nullptr));
        m_timeLabel->setText(QCoreApplication::translate("TransactionFrame", "TextLabel", nullptr));
        m_confirmationsLabel->setText(QCoreApplication::translate("TransactionFrame", "TextLabel", nullptr));
        m_txLabel->setText(QCoreApplication::translate("TransactionFrame", "TextLabel", nullptr));
        m_starkStatusLabel->setText(QString());
    } // retranslateUi

};

namespace Ui {
    class TransactionFrame: public Ui_TransactionFrame {};
} // namespace Ui

QT_END_NAMESPACE

#endif // UI_TRANSACTIONFRAME_H
